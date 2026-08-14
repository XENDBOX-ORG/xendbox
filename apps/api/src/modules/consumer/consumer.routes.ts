import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { assertOrgAccess } from "../../shared/middleware/org"
import { parseBody } from "../../shared/validate"
import { getParam } from "../../shared/params"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { createConsumer, getConsumerByUserId as getConsumerByUserIdService } from "./consumer.service"
import { createMerchantProfile, getMerchantProfile } from "./merchant-profile.service"
import { createConsumerSchema, createMerchantProfileSchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const consumers = new Hono()

consumers.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, createConsumerSchema)
    const consumer = await createConsumer(user.sub, body.type)
    return c.json(consumer, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

consumers.get("/me", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserIdService(user.sub)
    return c.json(consumer)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

consumers.post("/merchant-profile", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserIdService(user.sub)
    const body = await parseBody(c, createMerchantProfileSchema)
    await assertOrgAccess(user.sub, body.organization_id)
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
    const consumer = await getConsumerByUserIdService(user.sub)
    const profile = await getMerchantProfile(consumer.id)
    return c.json(profile)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default consumers
