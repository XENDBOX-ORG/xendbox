import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { parseBody } from "../../shared/validate"
import { getParam } from "../../shared/params"
import { getConsumerByUserId } from "../consumer/consumer.service"
import {
  createRecipient,
  listRecipients,
  getRecipientById,
  updateRecipient,
  deleteRecipient,
} from "./recipient.service"
import { createRecipientSchema, updateRecipientSchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const recipients = new Hono()

recipients.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await parseBody(c, createRecipientSchema)
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
    const recipient = await getRecipientById(getParam(c, "id"), consumer.id)
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
    const body = await parseBody(c, updateRecipientSchema)
    const recipient = await updateRecipient(getParam(c, "id"), consumer.id, body)
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
    const result = await deleteRecipient(getParam(c, "id"), consumer.id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default recipients