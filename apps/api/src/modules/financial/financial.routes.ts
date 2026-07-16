import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getRiderByUserId } from "../rider/rider.service"
import {
  getOrCreateUserAccount,
  getOrCreateOrganizationAccount,
  creditAccount,
  debitAccount,
  recordRiderEarning,
  getRiderEarnings,
  getRiderEarningsSummary,
} from "./financial.service"
import { AppError } from "../identity/auth.service"

const financial = new Hono()

financial.get("/account", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const account = await getOrCreateUserAccount(user.sub)
    return c.json(account)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/organizations/:orgId/account", authMiddleware, async (c) => {
  try {
    const account = await getOrCreateOrganizationAccount(c.req.param("orgId"))
    return c.json(account)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.post("/account/credit", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const { amount } = await c.req.json()
    const account = await creditAccount("USER", user.sub, amount)
    return c.json(account)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.post("/account/debit", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const { amount } = await c.req.json()
    const account = await debitAccount("USER", user.sub, amount)
    return c.json(account)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/earnings", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const earnings = await getRiderEarnings(rider.id)
    return c.json(earnings)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/earnings/summary", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const rider = await getRiderByUserId(user.sub)
    const summary = await getRiderEarningsSummary(rider.id)
    return c.json(summary)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default financial
