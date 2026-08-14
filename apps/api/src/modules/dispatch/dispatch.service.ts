import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"
import { notifyOrderDelivery, sendFireAndForget } from "../../shared/notify"
import { geoFindNearby, geoRemoveRider } from "@xendbox/maps"
import { enqueueDispatchTimeout, cancelDispatchTimeout } from "../../jobs"

async function findNearbyRiders(latitude: number, longitude: number, radiusKm: number = 5) {
  const ids = await geoFindNearby(latitude, longitude, radiusKm)
  if (ids.length === 0) return []

  return prisma.rider.findMany({
    where: { id: { in: ids } },
  })
}

export async function startDispatch(orderId: string, consumerId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, consumer_id: consumerId },
      include: { dispatch: true },
    })
    if (!order) throw new AppError("Order not found", 404)
    if (order.status !== "PAID") throw new AppError("Order must be PAID before dispatch", 400)
    if (order.dispatch) throw new AppError("Dispatch already started for this order", 409)

    const pickupAddress = await tx.address.findUnique({
      where: { id: order.pickup_address_id },
    })
    if (!pickupAddress?.latitude || !pickupAddress?.longitude) {
      throw new AppError("Pickup address must have coordinates for dispatch", 400)
    }

    const dispatch = await tx.dispatch.create({
      data: { order_id: orderId },
    })

    await enqueueDispatchTimeout(dispatch.id)

    await tx.order.update({
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
      await tx.dispatchAttempt.createMany({
        data: nearbyRiders.map((r) => ({
          dispatch_id: dispatch.id,
          rider_id: r.id,
        })),
      })
    }

    return tx.dispatch.findUnique({
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
  })
}

export async function startReturnDispatch(orderId: string, stationId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { pickup_station: true },
    })
    if (!order) throw new AppError("Order not found", 404)
    if (order.pickup_station_id !== stationId) {
      throw new AppError("Order is not associated with this station", 400)
    }
    if (order.status !== "RETURNED") {
      throw new AppError("Order must be RETURNED before return dispatch", 400)
    }

    const station = await tx.pickupStation.findUnique({
      where: { id: stationId },
      include: { address: true },
    })
    if (!station) throw new AppError("Pickup station not found", 404)
    if (!station.address?.latitude || !station.address?.longitude) {
      throw new AppError("Station must have coordinates for return dispatch", 400)
    }

    const dispatch = await tx.dispatch.create({
      data: { order_id: orderId, type: "RETURN" },
    })

    await enqueueDispatchTimeout(dispatch.id)

    await tx.order.update({
      where: { id: orderId },
      data: {
        events: {
          create: {
            event_type: "RETURN_DISPATCH_STARTED",
            metadata: { dispatch_id: dispatch.id },
          },
        },
      },
    })

    const nearbyRiders = await findNearbyRiders(station.address.latitude, station.address.longitude)

    if (nearbyRiders.length > 0) {
      await tx.dispatchAttempt.createMany({
        data: nearbyRiders.map((r) => ({
          dispatch_id: dispatch.id,
          rider_id: r.id,
        })),
      })
    }

    return tx.dispatch.findUnique({
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
  })
}

export async function acceptAttempt(attemptId: string, riderId: string) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.dispatchAttempt.findUnique({
      where: { id: attemptId },
      include: { dispatch: { include: { order: true } } },
    })
    if (!attempt || attempt.rider_id !== riderId) throw new AppError("Dispatch attempt not found", 404)
    if (attempt.status !== "PENDING") throw new AppError("Attempt already responded to", 400)
    if (attempt.dispatch.status !== "SEARCHING") throw new AppError("Dispatch is no longer active", 400)

    const responseTime = Math.round(
      (Date.now() - attempt.created_at.getTime()) / 1000
    )

    const accepted = await tx.dispatchAttempt.updateMany({
      where: { id: attemptId, status: "PENDING" },
      data: { status: "ACCEPTED", response_time: responseTime },
    })
    if (accepted.count === 0) throw new AppError("Attempt already responded to", 400)

    const dispatch = await tx.dispatch.update({
      where: { id: attempt.dispatch_id },
      data: {
        status: "RIDER_ACCEPTED",
        assigned_rider_id: riderId,
      },
    })

    await cancelDispatchTimeout(dispatch.id)

    await tx.riderAvailability.update({
      where: { rider_id: riderId },
      data: { status: "BUSY" },
    })
    await geoRemoveRider(riderId)

    await tx.order.update({
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

    await tx.dispatchAttempt.updateMany({
      where: {
        dispatch_id: attempt.dispatch_id,
        id: { not: attemptId },
        status: "PENDING",
      },
      data: { status: "DECLINED" },
    })

    const order = await tx.order.findUnique({
      where: { id: attempt.dispatch.order_id },
      select: { id: true },
    })

    if (order) {
      await sendFireAndForget(() =>
        notifyOrderDelivery(order.id, "nearby")
      )
    }

    return dispatch
  })
}

export async function declineAttempt(attemptId: string, riderId: string) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.dispatchAttempt.findUnique({
      where: { id: attemptId },
    })
    if (!attempt || attempt.rider_id !== riderId) throw new AppError("Dispatch attempt not found", 404)

    const responseTime = Math.round(
      (Date.now() - attempt.created_at.getTime()) / 1000
    )

    const declined = await tx.dispatchAttempt.updateMany({
      where: { id: attemptId, rider_id: riderId, status: "PENDING" },
      data: { status: "DECLINED", response_time: responseTime },
    })
    if (declined.count === 0) throw new AppError("Attempt already responded to", 400)

    return { message: "Attempt declined" }
  })
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
