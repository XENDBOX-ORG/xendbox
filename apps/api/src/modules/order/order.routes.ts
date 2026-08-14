import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { parseBody } from "../../shared/validate"
import { getParam } from "../../shared/params"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { createOrder, getOrderById, listOrders, updateOrderStatus } from "./order.service"
import { createOrderSchema, updateOrderStatusSchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const orders = new Hono()

orders.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await parseBody(c, createOrderSchema)
    const order = await createOrder(consumer.id, body)
    return c.json(order, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

orders.get("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const list = await listOrders(consumer.id)
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

orders.get("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const order = await getOrderById(getParam(c, "id"), consumer.id)
    return c.json(order)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

orders.patch("/:id/status", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await parseBody(c, updateOrderStatusSchema)
    const order = await updateOrderStatus(getParam(c, "id"), consumer.id, body.status)
    return c.json(order)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default orders