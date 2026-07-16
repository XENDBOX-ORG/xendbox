import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getRiderByUserId } from "../rider/rider.service"
import { getConsumerByUserId } from "../consumer/consumer.service"
import {
  updateLocation,
  getRiderLocationForOrder,
  getRiderLocationHistory,
} from "./tracking.service"
import { AppError } from "../identity/auth.service"

const tracking = new Hono()

tracking.post("/location", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const body = await c.req.json()
    const result = await updateLocation(rider.id, body)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

tracking.get("/orders/:orderId/rider", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await getRiderLocationForOrder(c.req.param("orderId"), consumer.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

tracking.get("/history", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const since = c.req.query("since") ? new Date(c.req.query("since")!) : undefined
    const history = await getRiderLocationHistory(rider.id, since)
    return c.json(history)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default tracking
