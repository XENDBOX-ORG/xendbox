import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

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

export async function startDispatch(orderId: string, consumerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
    include: { dispatch: true },
  })
  if (!order) throw new AppError("Order not found", 404)
  if (order.status !== "PAID") throw new AppError("Order must be PAID before dispatch", 400)
  if (order.dispatch) throw new AppError("Dispatch already started for this order", 409)

  const pickupAddress = await prisma.address.findUnique({
    where: { id: order.pickup_address_id },
  })
  if (!pickupAddress?.latitude || !pickupAddress?.longitude) {
    throw new AppError("Pickup address must have coordinates for dispatch", 400)
  }

  const dispatch = await prisma.dispatch.create({
    data: { order_id: orderId },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SEARCHING_RIDER",
      events: {
        create: {
          event_type: "DISPATCH_STARTED",
          metadata: { dispatch_id: dispatch.id },
        },
      },
    },
  })

  const nearbyRiders = await findNearbyRiders(pickupAddress.latitude, pickupAddress.longitude)

  if (nearbyRiders.length > 0) {
    await prisma.dispatchAttempt.createMany({
      data: nearbyRiders.map((r) => ({
        dispatch_id: dispatch.id,
        rider_id: r.id,
      })),
    })
  }

  return prisma.dispatch.findUnique({
    where: { id: dispatch.id },
    include: {
      attempts: {
        include: {
          rider: {
            include: {
              user: { select: { id: true, first_name: true, last_name: true, phone: true } },
            },
          },
        },
      },
    },
  })
}

async function findNearbyRiders(latitude: number, longitude: number, radiusKm: number = 5) {
  const availabilities = await prisma.riderAvailability.findMany({
    where: {
      status: "ONLINE",
      latitude: { not: null },
      longitude: { not: null },
    },
    include: { rider: true },
  })

  return availabilities
    .filter((a) => {
      if (a.latitude == null || a.longitude == null) return false
      return haversineDistance(latitude, longitude, a.latitude, a.longitude) <= radiusKm
    })
    .map((a) => a.rider)
}

export async function acceptAttempt(attemptId: string, riderId: string) {
  const attempt = await prisma.dispatchAttempt.findUnique({
    where: { id: attemptId },
    include: { dispatch: { include: { order: true } } },
  })
  if (!attempt || attempt.rider_id !== riderId) throw new AppError("Dispatch attempt not found", 404)
  if (attempt.status !== "PENDING") throw new AppError("Attempt already responded to", 400)
  if (attempt.dispatch.status !== "SEARCHING") throw new AppError("Dispatch is no longer active", 400)

  const responseTime = Math.round(
    (Date.now() - attempt.created_at.getTime()) / 1000
  )

  await prisma.dispatchAttempt.update({
    where: { id: attemptId },
    data: { status: "ACCEPTED", response_time: responseTime },
  })

  const dispatch = await prisma.dispatch.update({
    where: { id: attempt.dispatch_id },
    data: {
      status: "RIDER_ACCEPTED",
      assigned_rider_id: riderId,
    },
  })

  await prisma.riderAvailability.update({
    where: { rider_id: riderId },
    data: { status: "BUSY" },
  })

  await prisma.order.update({
    where: { id: attempt.dispatch.order_id },
    data: {
      status: "RIDER_ASSIGNED",
      events: {
        create: {
          event_type: "RIDER_ASSIGNED",
          metadata: { rider_id: riderId, dispatch_id: dispatch.id },
        },
      },
    },
  })

  await prisma.dispatchAttempt.updateMany({
    where: {
      dispatch_id: attempt.dispatch_id,
      id: { not: attemptId },
      status: "PENDING",
    },
    data: { status: "DECLINED" },
  })

  return dispatch
}

export async function declineAttempt(attemptId: string, riderId: string) {
  const attempt = await prisma.dispatchAttempt.findUnique({
    where: { id: attemptId },
  })
  if (!attempt || attempt.rider_id !== riderId) throw new AppError("Dispatch attempt not found", 404)
  if (attempt.status !== "PENDING") throw new AppError("Attempt already responded to", 400)

  const responseTime = Math.round(
    (Date.now() - attempt.created_at.getTime()) / 1000
  )

  await prisma.dispatchAttempt.update({
    where: { id: attemptId },
    data: { status: "DECLINED", response_time: responseTime },
  })

  return { message: "Attempt declined" }
}

export async function getDispatchByOrder(orderId: string, consumerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
  })
  if (!order) throw new AppError("Order not found", 404)

  const dispatch = await prisma.dispatch.findUnique({
    where: { order_id: orderId },
    include: {
      assigned_rider: {
        include: {
          user: { select: { id: true, first_name: true, last_name: true, phone: true } },
        },
      },
      attempts: {
        include: {
          rider: {
            include: {
              user: { select: { id: true, first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      },
    },
  })

  if (!dispatch) throw new AppError("No dispatch found for this order", 404)
  return dispatch
}

export async function getPendingAttempts(riderId: string) {
  return prisma.dispatchAttempt.findMany({
    where: {
      rider_id: riderId,
      status: "PENDING",
      dispatch: { status: "SEARCHING" },
    },
    include: {
      dispatch: {
        include: {
          order: {
            include: {
              pickup_address: true,
              recipient: { include: { address: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  })
}
