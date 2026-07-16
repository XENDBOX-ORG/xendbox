import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { createConsumer, getConsumerByUserId } from "./consumer.service"
import { createMerchantProfile, getMerchantProfile } from "./merchant-profile.service"
import { AppError } from "../identity/auth.service"

const consumers = new Hono()

consumers.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const { type } = await c.req.json()
    const consumer = await createConsumer(user.sub, type)
    return c.json(consumer, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

consumers.get("/me", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    return c.json(consumer)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

consumers.post("/merchant-profile", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await c.req.json()
    const profile = await createMerchantProfile(consumer.id, body)
    return c.json(profile, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

consumers.get("/merchant-profile", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const profile = await getMerchantProfile(consumer.id)
    return c.json(profile)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default consumers
