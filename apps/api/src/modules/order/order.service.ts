import { prisma } from "@xendbox/database"
import crypto from "node:crypto"
import { AppError } from "../identity/auth.service"

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
  }
) {
  const deliveryOption = await prisma.deliveryOption.findUnique({
    where: { id: data.delivery_option_id },
  })
  if (!deliveryOption) throw new AppError("Delivery option not found", 404)

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
      events: {
        create: {
          event_type: "ORDER_CREATED",
          metadata: { price: data.price, delivery_option: deliveryOption.type },
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
      events: { orderBy: { created_at: "asc" } },
    },
  })

  return updated
}
