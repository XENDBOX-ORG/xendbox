import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireOrgMember, assertOrgAccess } from "../../shared/middleware/org"
import { getParam } from "../../shared/params"
import { parseBody, parseQuery } from "../../shared/validate"
import { generateSettlement, listSettlements, getSettlement } from "./settlement.service"
import { generateSettlementSchema, orgIdQuerySchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const settlements = new Hono()

settlements.post("/organizations/:orgId/generate", authMiddleware, requireOrgMember, async (c) => {
  try {
    const { period } = await parseBody(c, generateSettlementSchema)
    const settlement = await generateSettlement(getParam(c, "orgId"), period)
    return c.json(settlement, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

settlements.get("/organizations/:orgId", authMiddleware, requireOrgMember, async (c) => {
  try {
    const list = await listSettlements(getParam(c, "orgId"))
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

settlements.get("/:id", authMiddleware, async (c) => {
  try {
    const { orgId } = await parseQuery(c, orgIdQuerySchema)
    await assertOrgAccess(c.get("user").sub, orgId)
    const settlement = await getSettlement(getParam(c, "id"), orgId)
    return c.json(settlement)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default settlements
