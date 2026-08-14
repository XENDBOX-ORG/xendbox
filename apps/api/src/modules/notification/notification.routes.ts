import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getParam } from "../../shared/params"
import { parseQuery } from "../../shared/validate"
import { listNotificationsQuerySchema } from "@xendbox/validation"
import { listNotifications, markRead, markAllRead } from "./notification.service"
import { AppError } from "../../shared/errors"

const notification = new Hono()

notification.use("*", authMiddleware)

notification.get("/", async (c) => {
  try {
    const user = c.get("user")
    const query = await parseQuery(c, listNotificationsQuerySchema)
    const result = await listNotifications(user.sub, query.page, query.limit, query.unread_only)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

notification.patch("/:notificationId/read", async (c) => {
  try {
    const user = c.get("user")
    const result = await markRead(user.sub, getParam(c, "notificationId"))
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

notification.patch("/read-all", async (c) => {
  try {
    const user = c.get("user")
    const result = await markAllRead(user.sub)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default notification