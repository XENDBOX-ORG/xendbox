import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getConsumerByUserId } from "../consumer/consumer.service"
import {
  createPickupStation,
  getPickupStation,
  listPickupStations,
  receiveParcel,
  markReadyForCollection,
  collectParcel,
  generatePickupCode,
  listStationParcels,
} from "./pickup-station.service"
import { AppError } from "../identity/auth.service"

const pickupStations = new Hono()

pickupStations.post("/", authMiddleware, async (c) => {
  try {
    const { organization_id, ...data } = await c.req.json()
    const station = await createPickupStation(organization_id, data)
    return c.json(station, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.get("/", authMiddleware, async (c) => {
  try {
    const list = await listPickupStations()
    return c.json(list)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.get("/:id", authMiddleware, async (c) => {
  try {
    const station = await getPickupStation(c.req.param("id"))
    return c.json(station)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.get("/:id/parcels", authMiddleware, async (c) => {
  try {
    const parcels = await listStationParcels(c.req.param("id"))
    return c.json(parcels)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.post("/:id/parcels/receive", authMiddleware, async (c) => {
  try {
    const { order_id } = await c.req.json()
    const parcel = await receiveParcel(c.req.param("id"), order_id)
    return c.json(parcel, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.patch("/:id/parcels/:parcelId/ready", authMiddleware, async (c) => {
  try {
    const parcel = await markReadyForCollection(c.req.param("parcelId"), c.req.param("id"))
    return c.json(parcel)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.post("/:id/parcels/:parcelId/collect", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const { pickup_code } = await c.req.json()
    const result = await collectParcel(c.req.param("parcelId"), c.req.param("id"), pickup_code, user.sub)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.post("/orders/:orderId/pickup-code", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const result = await generatePickupCode(c.req.param("orderId"), consumer.id)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default pickupStations
