import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"
import { sendWelcomeEmail } from "../../shared/notify"
import { geoAddRider, geoRemoveRider, geoFindNearby } from "@xendbox/maps"

export async function createRider(
  userId: string,
  data: {
    type: "INDEPENDENT" | "COMPANY"
    vehicle_type?: string
    organization_id?: string
  }
) {
  const existing = await prisma.rider.findUnique({ where: { user_id: userId } })
  if (existing) throw new AppError("Rider profile already exists", 409)

  if (data.type === "COMPANY") {
    if (!data.organization_id) throw new AppError("Company riders must have an organization_id", 400)

    const org = await prisma.organization.findUnique({ where: { id: data.organization_id } })
    if (!org || org.type !== "LOGISTICS_COMPANY") {
      throw new AppError("Organization must be a logistics company", 400)
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: data.organization_id,
          user_id: userId,
        },
      },
    })
    if (!member || member.role !== "RIDER") {
      throw new AppError("User must be a RIDER member of the organization", 403)
    }
  }

  const rider = await prisma.rider.create({
    data: {
      user_id: userId,
      type: data.type,
      vehicle_type: data.vehicle_type,
      organization_id: data.organization_id,
    },
    include: {
      user: {
        select: { id: true, email: true, phone: true, first_name: true, last_name: true },
      },
    },
  })

  sendWelcomeEmail(userId, "rider")

  return rider
}

export async function getRiderByUserId(userId: string) {
  const rider = await prisma.rider.findUnique({
    where: { user_id: userId },
    include: {
      user: {
        select: { id: true, email: true, phone: true, first_name: true, last_name: true, avatar: true },
      },
      availability: true,
      organization: true,
    },
  })

  if (!rider) throw new AppError("Rider profile not found", 404)
  return rider
}

export async function getRiderById(id: string) {
  const rider = await prisma.rider.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true, phone: true, first_name: true, last_name: true, avatar: true },
      },
      availability: true,
      organization: true,
    },
  })

  if (!rider) throw new AppError("Rider not found", 404)
  return rider
}

export async function updateAvailability(
  riderId: string,
  data: {
    status?: "ONLINE" | "OFFLINE" | "BUSY" | "PAUSED"
    latitude?: number
    longitude?: number
  }
) {
  const rider = await prisma.rider.findUnique({ where: { id: riderId } })
  if (!rider) throw new AppError("Rider not found", 404)

  const availability = await prisma.riderAvailability.upsert({
    where: { rider_id: riderId },
    create: {
      rider_id: riderId,
      status: data.status || "ONLINE",
      latitude: data.latitude,
      longitude: data.longitude,
    },
    update: {
      status: data.status,
      latitude: data.latitude,
      longitude: data.longitude,
      last_seen_at: new Date(),
    },
  })

  const isOnline = (data.status ?? availability.status) === "ONLINE"
  if (data.latitude != null && data.longitude != null) {
    if (isOnline) {
      await geoAddRider(riderId, data.latitude, data.longitude)
    } else {
      await geoRemoveRider(riderId)
    }
  }

  return availability
}

export async function getAvailability(riderId: string) {
  const availability = await prisma.riderAvailability.findUnique({
    where: { rider_id: riderId },
  })

  if (!availability) throw new AppError("Availability not set", 404)
  return availability
}

export async function listNearbyRiders(latitude: number, longitude: number, radiusKm: number = 5) {
  const ids = await geoFindNearby(latitude, longitude, radiusKm)

  if (ids.length === 0) return []

  return prisma.rider.findMany({
    where: { id: { in: ids } },
    include: {
      user: {
        select: { id: true, first_name: true, last_name: true, phone: true },
      },
      availability: true,
    },
  })
}
