import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { createOrder, getOrderById, listOrders, updateOrderStatus } from "./order.service"
import { AppError } from "../identity/auth.service"

const orders = new Hono()

orders.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await c.req.json()
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
    const order = await getOrderById(c.req.param("id"), consumer.id)
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
    const { status } = await c.req.json()
    const order = await updateOrderStatus(c.req.param("id"), consumer.id, status)
    return c.json(order)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default orders
