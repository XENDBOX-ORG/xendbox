import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getConsumerByUserId } from "../consumer/consumer.service"
import {
  createRecipient,
  listRecipients,
  getRecipientById,
  updateRecipient,
  deleteRecipient,
} from "./recipient.service"
import { AppError } from "../identity/auth.service"

const recipients = new Hono()

recipients.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await c.req.json()
    const recipient = await createRecipient(consumer.id, body)
    return c.json(recipient, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

recipients.get("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const list = await listRecipients(consumer.id)
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

recipients.get("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const recipient = await getRecipientById(c.req.param("id"), consumer.id)
    return c.json(recipient)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

recipients.put("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await c.req.json()
    const recipient = await updateRecipient(c.req.param("id"), consumer.id, body)
    return c.json(recipient)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

recipients.delete("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await deleteRecipient(c.req.param("id"), consumer.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default recipients
