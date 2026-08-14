import { Hono } from "hono"
import {
  registerUser,
  loginUser,
  refreshTokens,
  sendOtp,
  verifyOtp,
} from "./auth.service"
import { AppError } from "../../shared/errors"
import { parseBody } from "../../shared/validate"
import { registerSchema, loginSchema, refreshSchema, sendOtpSchema, verifyOtpSchema } from "@xendbox/validation"

const auth = new Hono()

auth.post("/register", async (c) => {
  try {
    const body = await parseBody(c, registerSchema)
    const result = await registerUser(body)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/login", async (c) => {
  try {
    const body = await parseBody(c, loginSchema)
    const { identifier, password } = body
    const result = await loginUser(identifier, password)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/refresh", async (c) => {
  try {
    const body = await parseBody(c, refreshSchema)
    const result = await refreshTokens(body.refresh_token)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/otp/send", async (c) => {
  try {
    const body = await parseBody(c, sendOtpSchema)
    const { identifier, channel } = body
    const result = await sendOtp(identifier, channel || "email")
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

auth.post("/otp/verify", async (c) => {
  try {
    const body = await parseBody(c, verifyOtpSchema)
    const { identifier, code } = body
    const result = await verifyOtp(identifier, code)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default auth
