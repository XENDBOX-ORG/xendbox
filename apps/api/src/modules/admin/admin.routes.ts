import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireAdmin } from "../../shared/middleware/admin"
import { getParam } from "../../shared/params"
import { parseBody, parseQuery } from "../../shared/validate"
import {
  adminStatsQuerySchema,
  adminListUsersQuerySchema,
  adminListOrgsQuerySchema,
  adminUpdateUserSchema,
} from "@xendbox/validation"
import {
  getPlatformStats,
  listAdminUsers,
  updateAdminUser,
  listAdminOrganizations,
  suspendOrganization,
} from "./admin.service"
import { AppError } from "../../shared/errors"

const admin = new Hono()

admin.use("*", authMiddleware, requireAdmin)

admin.get("/stats", async (c) => {
  try {
    const query = await parseQuery(c, adminStatsQuerySchema)
    const from = query.from ? new Date(query.from) : undefined
    const to = query.to ? new Date(query.to) : undefined
    const stats = await getPlatformStats(from, to)
    return c.json(stats)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

admin.get("/users", async (c) => {
  try {
    const query = await parseQuery(c, adminListUsersQuerySchema)
    const result = await listAdminUsers(query.page, query.limit, {
      role: query.role,
      status: query.status,
    })
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

admin.patch("/users/:userId", async (c) => {
  try {
    const body = await parseBody(c, adminUpdateUserSchema)
    const user = await updateAdminUser(getParam(c, "userId"), body)
    return c.json(user)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

admin.get("/organizations", async (c) => {
  try {
    const query = await parseQuery(c, adminListOrgsQuerySchema)
    const result = await listAdminOrganizations(query.page, query.limit)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

admin.post("/organizations/:orgId/suspend", async (c) => {
  try {
    const result = await suspendOrganization(getParam(c, "orgId"))
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default admin