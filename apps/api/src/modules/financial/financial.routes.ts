import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireOrgMember } from "../../shared/middleware/org"
import { getParam } from "../../shared/params"
import { getRiderByUserId } from "../rider/rider.service"
import {
  getOrCreateUserAccount,
  getOrCreateOrganizationAccount,
  getRiderEarnings,
  getRiderEarningsSummary,
  getOrProvisionVirtualAccount,
  listAccountTransactions,
} from "./financial.service"
import { resolveFinancialActorKind, canHaveVirtualAccount } from "./actor"
import { AppError } from "../../shared/errors"

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

financial.get("/account/transactions", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const account = await getOrCreateUserAccount(user.sub)
    const transactions = await listAccountTransactions(account.id)
    return c.json(transactions)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/virtual-account", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const kind = await resolveFinancialActorKind("USER", user.sub)
    if (!canHaveVirtualAccount(kind)) {
      throw new AppError("Virtual accounts are not available for your account", 403)
    }
    const va = await getOrProvisionVirtualAccount("USER", user.sub)
    return c.json(va)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/organizations/:orgId/account", authMiddleware, requireOrgMember, async (c) => {
  try {
    const account = await getOrCreateOrganizationAccount(getParam(c, "orgId"))
    return c.json(account)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/organizations/:orgId/account/transactions", authMiddleware, requireOrgMember, async (c) => {
  try {
    const account = await getOrCreateOrganizationAccount(getParam(c, "orgId"))
    const transactions = await listAccountTransactions(account.id)
    return c.json(transactions)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

financial.get("/organizations/:orgId/virtual-account", authMiddleware, requireOrgMember, async (c) => {
  try {
    const orgId = getParam(c, "orgId")
    const kind = await resolveFinancialActorKind("ORGANIZATION", orgId)
    if (!canHaveVirtualAccount(kind)) {
      throw new AppError("Virtual accounts are not available for this organization", 403)
    }
    const va = await getOrProvisionVirtualAccount("ORGANIZATION", orgId)
    return c.json(va)
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