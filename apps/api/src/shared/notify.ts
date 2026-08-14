import { prisma } from "@xendbox/database"
import {
  sendEmail,
  renderWelcomeEmail,
  renderDeliveryUpdate,
  renderAccountNotification,
} from "@xendbox/notifications"

const deliveryNotificationTitles: Record<string, string> = {
  dispatched: "Order dispatched",
  in_transit: "Package in transit",
  nearby: "Rider assigned",
  delivered: "Package delivered",
}

const deliveryNotificationTypes: Record<string, "ORDER_UPDATE" | "DISPATCH_ALERT"> = {
  dispatched: "ORDER_UPDATE",
  in_transit: "ORDER_UPDATE",
  nearby: "DISPATCH_ALERT",
  delivered: "ORDER_UPDATE",
}

export async function sendWelcomeEmail(userId: string, role: "merchant" | "rider"): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, first_name: true },
  })
  if (!user?.email) return

  const { html, text } = renderWelcomeEmail({
    name: user.first_name,
    role,
  })

  await sendEmail({
    to: user.email,
    subject: `Welcome to Xendbox, ${user.first_name}!`,
    html,
    text,
  })
}

export async function notifyOrderDelivery(
  orderId: string,
  event: "dispatched" | "in_transit" | "nearby" | "delivered",
  fields?: {
    pickup?: string
    dropoff?: string
    eta?: string
    rider_name?: string
  }
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      consumer: {
        include: {
          user: { select: { id: true, email: true, first_name: true } },
        },
      },
      dispatch: {
        include: {
          assigned_rider: {
            include: { user: { select: { first_name: true, last_name: true } } },
          },
        },
      },
    },
  })
  if (!order) return

  const consumerUser = order.consumer?.user
  const riderName =
    fields?.rider_name ??
    (order.dispatch?.assigned_rider
      ? `${order.dispatch.assigned_rider.user.first_name} ${order.dispatch.assigned_rider.user.last_name}`
      : undefined)

  if (consumerUser) {
    const title = deliveryNotificationTitles[event] ?? "Delivery update"
    const message = `Update on order ${order.tracking_number}: ${event.replace("_", " ")}.`

    await prisma.notification.create({
      data: {
        user_id: consumerUser.id,
        type: deliveryNotificationTypes[event] ?? "ORDER_UPDATE",
        title,
        message,
      },
    })

    if (consumerUser.email) {
      await sendFireAndForget(() => sendDeliveryEmail(order, event, fields, riderName))
    }
  }
}

async function sendDeliveryEmail(
  order: {
    tracking_number: string
    consumer: { user: { email?: string | null } } | null
  },
  event: "dispatched" | "in_transit" | "nearby" | "delivered",
  fields?: {
    pickup?: string
    dropoff?: string
    eta?: string
    rider_name?: string
  },
  riderName?: string
): Promise<void> {
  const email = order.consumer?.user.email
  if (!email) return

  const { html, text } = renderDeliveryUpdate({
    type: event,
    orderId: order.tracking_number,
    pickup: fields?.pickup,
    dropoff: fields?.dropoff,
    eta: fields?.eta,
    riderName,
  })

  await sendEmail({
    to: email,
    subject: `Delivery update for order ${order.tracking_number}`,
    html,
    text,
  })
}

export async function notifyAccount(
  userId: string,
  type: "password_changed" | "email_updated" | "account_verified"
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, first_name: true },
  })
  if (!user?.email) return

  const { html, text } = renderAccountNotification({ type })

  await sendEmail({
    to: user.email,
    subject: "Xendbox account update",
    html,
    text,
  })
}

export async function sendFireAndForget(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    console.error("[notify] failed to send notification:", err)
  }
}