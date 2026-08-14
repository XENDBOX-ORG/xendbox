import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { parseBody } from "../../shared/validate"
import { getParam } from "../../shared/params"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { verifyWebhookSignature } from "../../lib/paystack"
import { monnify } from "../../lib/monnify"
import {
  initializeWalletFunding,
  verifyWalletFunding,
  initializeOrderPayment,
  payOrderFromWallet,
  handlePaystackWebhook,
  handleMonnifyWebhook,
} from "./payment.service"
import {
  initializeWalletFundingSchema,
  verifyPaymentSchema,
  initializeOrderPaymentSchema,
} from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const payments = new Hono()

payments.post("/initialize/wallet", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, initializeWalletFundingSchema)
    const email = user.email
    if (!email) throw new AppError("User must have an email to make payments", 400)
    const result = await initializeWalletFunding(user.sub, email, body.amount)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

payments.post("/verify", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, verifyPaymentSchema)
    const result = await verifyWalletFunding(body.reference, user.sub)
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
    const body = await parseBody(c, initializeOrderPaymentSchema)
    const email = user.email
    if (!email) throw new AppError("User must have an email to make payments", 400)
    const result = await initializeOrderPayment(user.sub, email, body.order_id, consumer.id)
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
    const result = await payOrderFromWallet(getParam(c, "orderId"), consumer.id, user.sub)
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

payments.post("/monnify/webhook", async (c) => {
  const body = await c.req.text()
  const signature = c.req.header("monnify-signature") || ""

  if (!monnify.verifyWebhookSignature(signature, body)) {
    return c.json({ error: "Invalid signature" }, 401)
  }

  const payload = JSON.parse(body)
  const result = await handleMonnifyWebhook(payload)
  return c.json({ message: "Monnify webhook received", ...result })
})

export default payments