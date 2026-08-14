import { prisma } from "@xendbox/database"
import type { Prisma } from "@prisma/client"
import { AppError } from "../../shared/errors"

export async function rateRider(
  consumerId: string,
  data: { order_id: string; rider_id: string; rating: number; comment?: string }
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: data.order_id, consumer_id: consumerId },
      include: { dispatch: true, rider_rating: true },
    })
    if (!order) throw new AppError("Order not found", 404)
    if (!order.dispatch?.assigned_rider_id) {
      throw new AppError("No rider was assigned to this order", 400)
    }
    if (order.dispatch.assigned_rider_id !== data.rider_id) {
      throw new AppError("Rider was not assigned to this order", 400)
    }
    if (order.status !== "DELIVERED") {
      throw new AppError("Order must be DELIVERED before rating", 400)
    }
    if (order.rider_rating) {
      throw new AppError("Order has already been rated", 409)
    }

    await tx.riderRating.create({
      data: {
        rider_id: data.rider_id,
        consumer_id: consumerId,
        order_id: data.order_id,
        rating: data.rating,
        comment: data.comment,
      },
    })

    await recomputeRiderRating(tx, data.rider_id)

    return { message: "Rider rated successfully" }
  })
}

export async function rateStation(
  consumerId: string,
  data: { order_id: string; station_id: string; rating: number; comment?: string }
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: data.order_id, consumer_id: consumerId },
      include: { pickup_station: true, station_rating: true },
    })
    if (!order) throw new AppError("Order not found", 404)
    if (order.pickup_station_id !== data.station_id) {
      throw new AppError("Station was not associated with this order", 400)
    }
    if (order.status !== "COLLECTED" && order.status !== "RETURNED") {
      throw new AppError("Order must be COLLECTED before rating a station", 400)
    }
    if (order.station_rating) {
      throw new AppError("Order has already been rated", 409)
    }

    const station = await tx.pickupStation.findUnique({ where: { id: data.station_id } })
    if (!station) throw new AppError("Pickup station not found", 404)

    await tx.stationRating.create({
      data: {
        station_id: data.station_id,
        consumer_id: consumerId,
        order_id: data.order_id,
        rating: data.rating,
        comment: data.comment,
      },
    })

    return { message: "Station rated successfully" }
  })
}

export async function listRiderRatings(riderId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.riderRating.findMany({
      where: { rider_id: riderId },
      include: {
        consumer: {
          include: {
            user: { select: { id: true, first_name: true, last_name: true, avatar: true } },
          },
        },
        order: { select: { tracking_number: true, created_at: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.riderRating.count({ where: { rider_id: riderId } }),
  ])

  return { items, total, page, limit }
}

export async function listStationRatings(stationId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.stationRating.findMany({
      where: { station_id: stationId },
      include: {
        consumer: {
          include: {
            user: { select: { id: true, first_name: true, last_name: true, avatar: true } },
          },
        },
        order: { select: { tracking_number: true, created_at: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stationRating.count({ where: { station_id: stationId } }),
  ])

  return { items, total, page, limit }
}

async function recomputeRiderRating(tx: Prisma.TransactionClient, riderId: string) {
  const agg = await tx.riderRating.aggregate({
    where: { rider_id: riderId },
    _avg: { rating: true },
  })
  await tx.rider.update({
    where: { id: riderId },
    data: { rating: agg._avg.rating },
  })
}