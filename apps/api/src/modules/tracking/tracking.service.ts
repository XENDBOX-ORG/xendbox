import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

export async function updateLocation(
  riderId: string,
  data: { latitude: number; longitude: number }
) {
  await prisma.$transaction([
    prisma.riderLocationHistory.create({
      data: {
        rider_id: riderId,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    }),
    prisma.riderAvailability.update({
      where: { rider_id: riderId },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        last_seen_at: new Date(),
        status: "ONLINE",
      },
    }),
  ])

  return { message: "Location updated" }
}

export async function getRiderLocationForOrder(orderId: string, consumerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
    include: {
      dispatch: {
        include: {
          assigned_rider: {
            include: {
              availability: true,
              user: {
                select: { id: true, first_name: true, last_name: true, phone: true },
              },
            },
          },
        },
      },
    },
  })

  if (!order) throw new AppError("Order not found", 404)
  if (!order.dispatch?.assigned_rider) throw new AppError("No rider assigned yet", 404)

  const rider = order.dispatch.assigned_rider
  const availability = rider.availability

  const recentLocation = await prisma.riderLocationHistory.findFirst({
    where: { rider_id: rider.id },
    orderBy: { timestamp: "desc" },
  })

  return {
    rider: {
      id: rider.id,
      name: `${rider.user.first_name} ${rider.user.last_name}`,
      phone: rider.user.phone,
      rating: rider.rating,
      vehicle_type: rider.vehicle_type,
    },
    location: availability
      ? {
          latitude: availability.latitude,
          longitude: availability.longitude,
          last_seen_at: availability.last_seen_at,
        }
      : recentLocation
        ? {
            latitude: recentLocation.latitude,
            longitude: recentLocation.longitude,
            last_seen_at: recentLocation.timestamp,
          }
        : null,
  }
}

export async function getRiderLocationHistory(
  riderId: string,
  since?: Date
) {
  return prisma.riderLocationHistory.findMany({
    where: {
      rider_id: riderId,
      ...(since ? { timestamp: { gte: since } } : {}),
    },
    orderBy: { timestamp: "asc" },
    take: 500,
  })
}
