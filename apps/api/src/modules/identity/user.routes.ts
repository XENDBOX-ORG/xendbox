import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getUserById } from "./user.service"
import { AppError } from "../../shared/errors"

const users = new Hono()

users.get("/me", authMiddleware, async (c) => {
  try {
    const payload = c.get("user")
    const user = await getUserById(payload.sub)
    return c.json(user)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default users
