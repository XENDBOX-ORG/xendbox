import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { parseBody, parseQuery } from "../../shared/validate"
import {
  createRider,
  getRiderByUserId,
  updateAvailability,
  getAvailability,
  listNearbyRiders,
} from "./rider.service"
import { createRiderSchema, updateAvailabilitySchema, nearbyQuerySchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const riders = new Hono()

riders.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, createRiderSchema)
    const rider = await createRider(user.sub, body)
    return c.json(rider, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

riders.get("/me", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    return c.json(rider)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

riders.patch("/me/availability", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const body = await parseBody(c, updateAvailabilitySchema)
    const availability = await updateAvailability(rider.id, body)
    return c.json(availability)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

riders.get("/me/availability", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const availability = await getAvailability(rider.id)
    return c.json(availability)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

riders.get("/nearby", authMiddleware, async (c) => {
  try {
    const query = await parseQuery(c, nearbyQuerySchema)
    const nearby = await listNearbyRiders(query.lat, query.lng, query.radius ?? 5)
    return c.json(nearby)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default riders