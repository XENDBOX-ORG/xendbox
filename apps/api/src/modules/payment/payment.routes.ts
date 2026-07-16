import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { verifyWebhookSignature } from "../../lib/paystack"
import {
  initializeWalletFunding,
  verifyWalletFunding,
  initializeOrderPayment,
  payOrderFromWallet,
  handlePaystackWebhook,
} from "./payment.service"
import { AppError } from "../identity/auth.service"

const payments = new Hono()

payments.post("/initialize/wallet", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const { amount } = await c.req.json()
    const email = user.email
    if (!email) throw new AppError("User must have an email to make payments", 400)
    const result = await initializeWalletFunding(user.sub, email, amount)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

payments.post("/verify", authMiddleware, async (c) => {
  try {
    const { reference } = await c.req.json()
    const result = await verifyWalletFunding(reference)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

payments.post("/initialize/order", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const { order_id } = await c.req.json()
    const email = user.email
    if (!email) throw new AppError("User must have an email to make payments", 400)
    const result = await initializeOrderPayment(user.sub, email, order_id, consumer.id)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

payments.post("/orders/:orderId/pay", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await payOrderFromWallet(c.req.param("orderId"), consumer.id, user.sub)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

payments.post("/webhook", async (c) => {
  const body = await c.req.text()
  const signature = c.req.header("x-paystack-signature") || ""

  if (!verifyWebhookSignature(signature, body)) {
    return c.json({ error: "Invalid signature" }, 401)
  }

  const payload = JSON.parse(body)
  await handlePaystackWebhook(payload.event, payload.data)
  return c.json({ message: "Webhook received" })
})

export default payments
