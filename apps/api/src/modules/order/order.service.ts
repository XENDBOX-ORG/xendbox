import { prisma } from "@xendbox/database"
import crypto from "node:crypto"
import { AppError } from "../../shared/errors"
import { settleDelivery, releaseReservationForOrder } from "../financial/financial.service"
import { notifyOrderDelivery, sendFireAndForget } from "../../shared/notify"
import { dispatchWebhook } from "../../shared/webhook"
import { enqueueOrderExpiry, cancelOrderExpiry } from "../../jobs"

function generateTrackingNumber(): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase()
  return `XND-${suffix}`
}

export async function createOrder(
  consumerId: string,
  data: {
    delivery_option_id: string
    pickup_address_id: string
    recipient_id: string
    price: number
    pickup_station_id?: string
  }
) {
  const deliveryOption = await prisma.deliveryOption.findUnique({
    where: { id: data.delivery_option_id },
  })
  if (!deliveryOption) throw new AppError("Delivery option not found", 404)

  let pickup_station_id: string | undefined
  if (deliveryOption.type === "PICKUP_STATION") {
    if (!data.pickup_station_id) {
      throw new AppError("pickup_station_id is required for pickup station delivery", 400)
    }
    const station = await prisma.pickupStation.findFirst({
      where: { id: data.pickup_station_id, status: "ACTIVE" },
    })
    if (!station) throw new AppError("Pickup station not found or inactive", 404)
    pickup_station_id = station.id
  }

  const recipient = await prisma.recipient.findFirst({
    where: { id: data.recipient_id, consumer_id: consumerId },
  })
  if (!recipient) throw new AppError("Recipient not found", 404)

  const address = await prisma.address.findUnique({
    where: { id: data.pickup_address_id },
  })
  if (!address) throw new AppError("Pickup address not found", 404)

  const tracking_number = generateTrackingNumber()

  const order = await prisma.order.create({
    data: {
      tracking_number,
      consumer_id: consumerId,
      delivery_option_id: data.delivery_option_id,
      pickup_address_id: data.pickup_address_id,
      recipient_id: data.recipient_id,
      price: data.price,
      pickup_station_id,
      events: {
        create: {
          event_type: "ORDER_CREATED",
          metadata: {
            price: data.price,
            delivery_option: deliveryOption.type,
            pickup_station_id,
          },
        },
      },
    },
    include: {
      delivery_option: true,
      pickup_address: true,
      recipient: { include: { address: true } },
      events: { orderBy: { created_at: "asc" } },
    },
  })

  await enqueueOrderExpiry(order.id)

  return order
}

export async function getOrderById(orderId: string, consumerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
    include: {
      delivery_option: true,
      pickup_address: true,
      recipient: { include: { address: true } },
      events: { orderBy: { created_at: "asc" } },
    },
  })

  if (!order) throw new AppError("Order not found", 404)
  return order
}

export async function listOrders(consumerId: string) {
  return prisma.order.findMany({
    where: { consumer_id: consumerId },
    include: {
      delivery_option: true,
      pickup_address: true,
      recipient: { include: { address: true } },
      events: { orderBy: { created_at: "desc" }, take: 1 },
    },
    orderBy: { created_at: "desc" },
  })
}

export async function updateOrderStatus(
  orderId: string,
  consumerId: string,
  status: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
  })
  if (!order) throw new AppError("Order not found", 404)

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as any,
      events: {
        create: {
          event_type: `ORDER_${status}`,
          metadata: { previous_status: order.status },
        },
      },
    },
    include: {
      delivery_option: true,
      pickup_address: true,
      recipient: { include: { address: true } },
      dispatch: { include: { assigned_rider: true } },
      events: { orderBy: { created_at: "asc" } },
    },
  })

  await triggerOrderHandoffs(updated.id, updated.status as string)

  return updated
}

async function triggerOrderHandoffs(
  orderId: string,
  status: string
) {
  switch (status) {
    case "PICKED_UP":
      await sendFireAndForget(() =>
        notifyOrderDelivery(orderId, "dispatched")
      )
      break
    case "IN_TRANSIT":
      await sendFireAndForget(() =>
        notifyOrderDelivery(orderId, "in_transit")
      )
      break
    case "DELIVERED": {
      await settleDelivery(orderId)
      await sendFireAndForget(() =>
        notifyOrderDelivery(orderId, "delivered")
      )
      break
    }
    case "CANCELLED":
    case "FAILED":
    case "RETURNED": {
      await releaseReservationForOrder(orderId)
      break
    }
  }

  await sendFireAndForget(() => emitOrderWebhook(orderId, status, orderId))
}

async function emitOrderWebhook(orderId: string, status: string, _unused: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      consumer: { include: { merchant_profile: true } },
      pickup_station: true,
    },
  })
  if (!order) return

  const orgId = order.consumer?.merchant_profile?.organization_id ?? order.pickup_station?.organization_id
  if (!orgId) return

  await dispatchWebhook(orgId, "order.status_changed", {
    order_id: orderId,
    tracking_number: order.tracking_number,
    status,
    updated_at: new Date().toISOString(),
  })
}
