import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireOrgMember, assertOrgAccess } from "../../shared/middleware/org"
import { parseBody } from "../../shared/validate"
import { getParam } from "../../shared/params"
import { createVehicle, listVehicles, assignVehicle, unassignVehicle } from "./vehicle.service"
import { createVehicleSchema, assignVehicleSchema } from "@xendbox/validation"
import { AppError } from "../../shared/errors"

const vehicles = new Hono()

vehicles.post("/organizations/:orgId/vehicles", authMiddleware, requireOrgMember, async (c) => {
  try {
    const body = await parseBody(c, createVehicleSchema)
    const vehicle = await createVehicle(getParam(c, "orgId"), body)
    return c.json(vehicle, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

vehicles.get("/organizations/:orgId/vehicles", authMiddleware, requireOrgMember, async (c) => {
  try {
    const list = await listVehicles(getParam(c, "orgId"))
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

vehicles.post("/:vehicleId/assign", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, assignVehicleSchema)
    await assertOrgAccess(user.sub, body.organization_id)
    const assignment = await assignVehicle(getParam(c, "vehicleId"), body.rider_id, body.organization_id)
    return c.json(assignment, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

vehicles.post("/:vehicleId/unassign", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, assignVehicleSchema)
    await assertOrgAccess(user.sub, body.organization_id)
    const result = await unassignVehicle(getParam(c, "vehicleId"), body.rider_id, body.organization_id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default vehicles