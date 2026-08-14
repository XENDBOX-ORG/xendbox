import { z } from "zod"
import { idSchema, orgIdQuerySchema } from "./common"

export const ratingSchema = z.number().int().min(1, "Rating must be between 1 and 5").max(5)

export const createRiderRatingSchema = z.object({
  order_id: idSchema,
  rider_id: idSchema,
  rating: ratingSchema,
  comment: z.string().max(1000).optional(),
})

export const createStationRatingSchema = z.object({
  order_id: idSchema,
  station_id: idSchema,
  rating: ratingSchema,
  comment: z.string().max(1000).optional(),
})

export const listRiderRatingsQuerySchema = z.object({
  ...orgIdQuerySchema.shape,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})