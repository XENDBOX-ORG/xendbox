import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getParam } from "../../shared/params"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { getRiderByUserId } from "../rider/rider.service"
import {
  startDispatch,
  startReturnDispatch,
  acceptAttempt,
  declineAttempt,
  getDispatchByOrder,
  getPendingAttempts,
} from "./dispatch.service"
import { AppError } from "../../shared/errors"

const dispatch = new Hono()

dispatch.post("/orders/:orderId/start", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await startDispatch(getParam(c, "orderId"), consumer.id)
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
    const result = await getDispatchByOrder(getParam(c, "orderId"), consumer.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

dispatch.post("/orders/:orderId/return", authMiddleware, async (c) => {
  try {
    const stationId = c.req.query("stationId")
    if (!stationId) throw new AppError("stationId query parameter is required", 400)
    const result = await startReturnDispatch(getParam(c, "orderId"), stationId)
    return c.json(result, 201)
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
    const result = await acceptAttempt(getParam(c, "attemptId"), rider.id)
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
    const result = await declineAttempt(getParam(c, "attemptId"), rider.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default dispatch
