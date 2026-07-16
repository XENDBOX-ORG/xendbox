import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { generateSettlement, listSettlements, getSettlement } from "./settlement.service"
import { AppError } from "../identity/auth.service"

const settlements = new Hono()

settlements.post("/organizations/:orgId/generate", authMiddleware, async (c) => {
  try {
    const { period } = await c.req.json()
    const settlement = await generateSettlement(c.req.param("orgId"), period)
    return c.json(settlement, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

settlements.get("/organizations/:orgId", authMiddleware, async (c) => {
  try {
    const list = await listSettlements(c.req.param("orgId"))
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

settlements.get("/:id", authMiddleware, async (c) => {
  try {
    const { orgId } = c.req.query()
    if (!orgId) return c.json({ error: "orgId query param required" }, 400)
    const settlement = await getSettlement(c.req.param("id"), orgId)
    return c.json(settlement)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default settlements
