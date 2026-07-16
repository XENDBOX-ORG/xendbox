import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { createVehicle, listVehicles, assignVehicle, unassignVehicle } from "./vehicle.service"
import { AppError } from "../identity/auth.service"

const vehicles = new Hono()

vehicles.post("/organizations/:orgId/vehicles", authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const vehicle = await createVehicle(c.req.param("orgId"), body)
    return c.json(vehicle, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

vehicles.get("/organizations/:orgId/vehicles", authMiddleware, async (c) => {
  try {
    const list = await listVehicles(c.req.param("orgId"))
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

vehicles.post("/:vehicleId/assign", authMiddleware, async (c) => {
  try {
    const { rider_id, organization_id } = await c.req.json()
    const assignment = await assignVehicle(c.req.param("vehicleId"), rider_id, organization_id)
    return c.json(assignment, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

vehicles.post("/:vehicleId/unassign", authMiddleware, async (c) => {
  try {
    const { rider_id, organization_id } = await c.req.json()
    const result = await unassignVehicle(c.req.param("vehicleId"), rider_id, organization_id)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default vehicles
