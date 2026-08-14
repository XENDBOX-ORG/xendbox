import { prisma } from "@xendbox/database"
import { getRedisClient } from "@xendbox/redis"

const ONLINE_RIDERS_KEY = "riders:online"

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export async function geoAddRider(riderId: string, latitude: number, longitude: number): Promise<void> {
  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.geoadd(ONLINE_RIDERS_KEY, longitude, latitude, riderId)
      return
    } catch {
      /* fall back to PostgreSQL */
    }
  }
}

export async function geoRemoveRider(riderId: string): Promise<void> {
  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.zrem(ONLINE_RIDERS_KEY, riderId)
      return
    } catch {
      /* fall back to PostgreSQL */
    }
  }
}

export async function geoFindNearby(
  latitude: number,
  longitude: number,
  radiusKm: number,
  excludeRiderId?: string
): Promise<string[]> {
  const redis = getRedisClient()
  if (redis) {
    try {
      const members = await redis.geosearch(
        ONLINE_RIDERS_KEY,
        "FROMLONLAT",
        longitude,
        latitude,
        "BYRADIUS",
        radiusKm,
        "km",
        "ASC"
      )
      return (members as string[]).filter((id) => id !== excludeRiderId)
    } catch {
      /* fall through to PostgreSQL */
    }
  }

  const availabilities = await prisma.riderAvailability.findMany({
    where: {
      status: "ONLINE",
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { rider_id: true, latitude: true, longitude: true },
  })

  return availabilities
    .filter((a) => {
      if (a.latitude == null || a.longitude == null) return false
      if (a.rider_id === excludeRiderId) return false
      return haversineDistance(latitude, longitude, a.latitude, a.longitude) <= radiusKm
    })
    .map((a) => a.rider_id)
}