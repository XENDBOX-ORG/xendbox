import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { getParam } from "../../shared/params"
import { parseBody, parseQuery } from "../../shared/validate"
import { createRiderRatingSchema, createStationRatingSchema, listRiderRatingsQuerySchema } from "@xendbox/validation"
import { rateRider, rateStation, listRiderRatings, listStationRatings } from "./rating.service"
import { getConsumerByUserId } from "../consumer/consumer.service"
import { AppError } from "../../shared/errors"

const rating = new Hono()

rating.post("/riders", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await parseBody(c, createRiderRatingSchema)
    const result = await rateRider(consumer.id, body)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

rating.post("/stations", authMiddleware, async (c) => {
  try {
    const user = c.get("user")
    const consumer = await getConsumerByUserId(user.sub)
    const body = await parseBody(c, createStationRatingSchema)
    const result = await rateStation(consumer.id, body)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

rating.get("/riders/:riderId", authMiddleware, async (c) => {
  try {
    const query = await parseQuery(c, listRiderRatingsQuerySchema)
    const result = await listRiderRatings(getParam(c, "riderId"), query.page, query.limit)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

rating.get("/stations/:stationId", authMiddleware, async (c) => {
  try {
    const query = await parseQuery(c, listRiderRatingsQuerySchema)
    const result = await listStationRatings(getParam(c, "stationId"), query.page, query.limit)
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default rating