import { prisma } from "@xendbox/database"
import crypto from "node:crypto"
import { AppError } from "../../shared/errors"

export async function createPickupStation(
  organizationId: string,
  data: {
    name: string
    capacity?: number
    opening_hours?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      latitude?: number
      longitude?: number
    }
  }
) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org || org.type !== "PICKUP_STATION") {
    throw new AppError("Organization must be a pickup station type", 400)
  }

  const station = await prisma.pickupStation.create({
    data: {
      organization: { connect: { id: organizationId } },
      name: data.name,
      capacity: data.capacity,
      opening_hours: data.opening_hours,
      address: data.address ? { create: data.address } : undefined,
    },
    include: { address: true, organization: true },
  })

  return station
}

export async function getPickupStation(id: string) {
  const station = await prisma.pickupStation.findUnique({
    where: { id },
    include: { address: true, organization: true },
  })
  if (!station) throw new AppError("Pickup station not found", 404)
  return station
}

export async function listPickupStations() {
  return prisma.pickupStation.findMany({
    where: { status: "ACTIVE" },
    include: { address: true },
    orderBy: { name: "asc" },
  })
}

export async function receiveParcel(stationId: string, orderId: string) {
  return prisma.$transaction(async (tx) => {
    const station = await tx.pickupStation.findUnique({ where: { id: stationId } })
    if (!station) throw new AppError("Pickup station not found", 404)

    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) throw new AppError("Order not found", 404)

    const existing = await tx.stationParcel.findUnique({ where: { order_id: orderId } })
    if (existing) throw new AppError("Parcel already received at a station", 409)

    const parcel = await tx.stationParcel.create({
      data: { station_id: stationId, order_id: orderId, status: "ARRIVED" },
      include: { order: true },
    })

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "ARRIVED_AT_STATION",
        events: { create: { event_type: "ARRIVED_AT_STATION", metadata: { station_id: stationId } } },
      },
    })

    return parcel
  })
}

export async function markReadyForCollection(parcelId: string, stationId: string) {
  return prisma.$transaction(async (tx) => {
    const parcel = await tx.stationParcel.updateMany({
      where: { id: parcelId, station_id: stationId, status: { in: ["ARRIVED", "STORED"] } },
      data: { status: "READY_FOR_COLLECTION" },
    })
    if (parcel.count === 0) throw new AppError("Parcel not found or not in ARRIVED/STORED state", 404)

    const current = await tx.stationParcel.findUniqueOrThrow({ where: { id: parcelId } })

    await tx.order.update({
      where: { id: current.order_id },
      data: {
        status: "READY_FOR_COLLECTION",
        events: { create: { event_type: "READY_FOR_COLLECTION", metadata: { station_id: stationId } } },
      },
    })

    return current
  })
}

export async function markParcelStored(parcelId: string, stationId: string) {
  return prisma.$transaction(async (tx) => {
    const stored = await tx.stationParcel.updateMany({
      where: { id: parcelId, station_id: stationId, status: "ARRIVED" },
      data: { status: "STORED" },
    })
    if (stored.count === 0) throw new AppError("Parcel not found or not in ARRIVED state", 404)

    const current = await tx.stationParcel.findUniqueOrThrow({ where: { id: parcelId } })

    await tx.order.update({
      where: { id: current.order_id },
      data: {
        status: "ARRIVED_AT_STATION",
        events: { create: { event_type: "PARCEL_STORED", metadata: { station_id: stationId } } },
      },
    })

    return current
  })
}

export async function collectParcel(
  parcelId: string,
  stationId: string,
  pickupCode: string,
  verifiedBy: string
) {
  return prisma.$transaction(async (tx) => {
    const parcel = await tx.stationParcel.findFirst({
      where: { id: parcelId, station_id: stationId, status: "READY_FOR_COLLECTION" },
    })
    if (!parcel) throw new AppError("Parcel not ready for collection", 404)

    const code = await tx.pickupCode.findUnique({
      where: { order_id: parcel.order_id },
    })
    if (!code || code.status !== "ACTIVE") throw new AppError("No active pickup code for this order", 400)
    if (code.expires_at < new Date()) throw new AppError("Pickup code has expired", 400)

    const codeHash = hashCode(pickupCode)
    if (code.code_hash !== codeHash) throw new AppError("Invalid pickup code", 401)

    const consumed = await tx.pickupCode.updateMany({
      where: { id: code.id, status: "ACTIVE" },
      data: { status: "USED" },
    })
    if (consumed.count === 0) throw new AppError("Pickup code already used", 400)

    await tx.pickupVerificationLog.create({
      data: {
        order_id: parcel.order_id,
        station_id: stationId,
        verified_by: verifiedBy,
        method: "PICKUP_CODE",
        result: "VERIFIED",
      },
    })

    await tx.stationParcel.update({
      where: { id: parcelId },
      data: { status: "COLLECTED" },
    })

    await tx.order.update({
      where: { id: parcel.order_id },
      data: {
        status: "COLLECTED",
        events: { create: { event_type: "COLLECTED", metadata: { station_id: stationId } } },
      },
    })

    return { message: "Parcel collected successfully" }
  })
}

export async function generatePickupCode(orderId: string, consumerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
    include: { pickup_codes: true },
  })
  if (!order) throw new AppError("Order not found", 404)
  if (order.pickup_codes.length > 0) throw new AppError("Pickup code already generated", 409)

  const code = crypto.randomInt(100000, 999999).toString()
  const codeHash = hashCode(code)
  const qrToken = crypto.randomUUID()

  await prisma.pickupCode.create({
    data: {
      order_id: orderId,
      code_hash: codeHash,
      qr_token: qrToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { code, qr_token: qrToken, expires_in_days: 7 }
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

export async function markParcelReturned(parcelId: string, stationId: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.stationParcel.updateMany({
      where: { id: parcelId, station_id: stationId, status: { in: ["ARRIVED", "STORED", "READY_FOR_COLLECTION"] } },
      data: { status: "RETURNED" },
    })
    if (updated.count === 0) throw new AppError("Parcel not found or not in a returnable state", 404)

    const current = await tx.stationParcel.findUniqueOrThrow({ where: { id: parcelId } })

    await tx.order.update({
      where: { id: current.order_id },
      data: {
        status: "RETURNED",
        events: {
          create: {
            event_type: "RETURNED",
            metadata: { station_id: stationId, parcel_id: parcelId },
          },
        },
      },
    })

    return current
  })
}

export async function listStationParcels(stationId: string) {
  return prisma.stationParcel.findMany({
    where: { station_id: stationId },
    include: {
      order: {
        include: {
          recipient: { include: { address: true } },
          pickup_address: true,
        },
      },
    },
    orderBy: { received_at: "desc" },
  })
}
