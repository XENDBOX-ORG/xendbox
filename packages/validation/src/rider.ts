import { z } from "zod"
import { idSchema } from "./common"

export const riderTypeSchema = z.enum(["INDEPENDENT", "COMPANY"])

export const availabilityStatusSchema = z.enum(["ONLINE", "OFFLINE", "BUSY", "PAUSED"])

export const createRiderSchema = z
  .object({
    type: riderTypeSchema,
    vehicle_type: z.string().optional(),
    organization_id: idSchema.optional(),
  })
  .refine((d) => d.type !== "COMPANY" || d.organization_id, {
    message: "Company riders must have an organization_id",
  })

export const updateAvailabilitySchema = z.object({
  status: availabilityStatusSchema.optional(),
  latitude: z.number().min(-90).max(90).finite().optional(),
  longitude: z.number().min(-180).max(180).finite().optional(),
})

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(100).optional(),
})

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90).finite(),
  longitude: z.number().min(-180).max(180).finite(),
})