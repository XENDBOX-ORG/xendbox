import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import {
  createRider,
  getRiderByUserId,
  updateAvailability,
  getAvailability,
  listNearbyRiders,
} from "./rider.service"
import { AppError } from "../identity/auth.service"

const riders = new Hono()

riders.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await c.req.json()
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
    const body = await c.req.json()
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
    const { lat, lng, radius } = c.req.query()
    if (!lat || !lng) return c.json({ error: "lat and lng query params required" }, 400)
    const nearby = await listNearbyRiders(parseFloat(lat), parseFloat(lng), radius ? parseFloat(radius) : 5)
    return c.json(nearby)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default riders
