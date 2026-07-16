import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { getRiderByUserId } from "../rider/rider.service"
import {
  startDispatch,
  acceptAttempt,
  declineAttempt,
  getDispatchByOrder,
  getPendingAttempts,
} from "./dispatch.service"
import { AppError } from "../identity/auth.service"

const dispatch = new Hono()

dispatch.post("/orders/:orderId/start", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await startDispatch(c.req.param("orderId"), consumer.id)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

dispatch.get("/orders/:orderId", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await getDispatchByOrder(c.req.param("orderId"), consumer.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

dispatch.get("/attempts/pending", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const attempts = await getPendingAttempts(rider.id)
    return c.json(attempts)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

dispatch.post("/attempts/:attemptId/accept", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const result = await acceptAttempt(c.req.param("attemptId"), rider.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

dispatch.post("/attempts/:attemptId/decline", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const result = await declineAttempt(c.req.param("attemptId"), rider.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default dispatch
