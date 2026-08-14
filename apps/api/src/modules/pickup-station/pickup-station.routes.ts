import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireStationOrgMember, assertOrgAccess } from "../../shared/middleware/org"
import { getParam } from "../../shared/params"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { parseBody } from "../../shared/validate"
import {
  createPickupStationSchema,
  receiveParcelSchema,
  collectParcelSchema,
} from "@xendbox/validation"
import {
  createPickupStation,
  getPickupStation,
  listPickupStations,
  receiveParcel,
  markReadyForCollection,
  markParcelStored,
  markParcelReturned,
  collectParcel,
  generatePickupCode,
  listStationParcels,
} from "./pickup-station.service"
import { AppError } from "../../shared/errors"

const pickupStations = new Hono()

pickupStations.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const body = await parseBody(c, createPickupStationSchema)
    const { organization_id, ...data } = body
    await assertOrgAccess(user.sub, organization_id)
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
    const station = await getPickupStation(getParam(c, "id"))
    return c.json(station)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.get("/:id/parcels", authMiddleware, requireStationOrgMember, async (c) => {
  try {
    const parcels = await listStationParcels(getParam(c, "id"))
    return c.json(parcels)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.post("/:id/parcels/receive", authMiddleware, requireStationOrgMember, async (c) => {
  try {
    const { order_id } = await parseBody(c, receiveParcelSchema)
    const parcel = await receiveParcel(getParam(c, "id"), order_id)
    return c.json(parcel, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.patch("/:id/parcels/:parcelId/ready", authMiddleware, requireStationOrgMember, async (c) => {
  try {
    const parcel = await markReadyForCollection(getParam(c, "parcelId"), getParam(c, "id"))
    return c.json(parcel)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.patch("/:id/parcels/:parcelId/store", authMiddleware, requireStationOrgMember, async (c) => {
  try {
    const parcel = await markParcelStored(getParam(c, "parcelId"), getParam(c, "id"))
    return c.json(parcel)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.patch("/:id/parcels/:parcelId/return", authMiddleware, requireStationOrgMember, async (c) => {
  try {
    const parcel = await markParcelReturned(getParam(c, "parcelId"), getParam(c, "id"))
    return c.json(parcel)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

pickupStations.post("/:id/parcels/:parcelId/collect", authMiddleware, requireStationOrgMember, async (c) => {
  try {
    const user = c.get("user")
    const { pickup_code } = await parseBody(c, collectParcelSchema)
    const result = await collectParcel(getParam(c, "parcelId"), getParam(c, "id"), pickup_code, user.sub)
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
    const result = await generatePickupCode(getParam(c, "orderId"), consumer.id)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default pickupStations
