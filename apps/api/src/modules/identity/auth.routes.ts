import { Hono } from "hono"
import {
  registerUser,
  loginUser,
  refreshTokens,
  sendOtp,
  verifyOtp,
  AppError,
} from "./auth.service"

const auth = new Hono()

auth.post("/register", async (c) => {
  try {
    const body = await c.req.json()
    const result = await registerUser(body)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/login", async (c) => {
  try {
    const { identifier, password } = await c.req.json()
    const result = await loginUser(identifier, password)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/refresh", async (c) => {
  try {
    const { refresh_token } = await c.req.json()
    const result = await refreshTokens(refresh_token)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/otp/send", async (c) => {
  try {
    const { identifier, channel } = await c.req.json()
    const result = await sendOtp(identifier, channel || "email")
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/otp/verify", async (c) => {
  try {
    const { identifier, code } = await c.req.json()
    const result = await verifyOtp(identifier, code)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default auth
