import { z } from "zod"
import { idSchema } from "./common"

export const createVehicleSchema = z.object({
  type: z.string().min(1, "Vehicle type is required"),
  plate_number: z.string().optional(),
  capacity: z.number().positive().finite().optional(),
})

export const assignVehicleSchema = z.object({
  rider_id: idSchema,
  organization_id: idSchema,
})

export const createPickupStationSchema = z.object({
  organization_id: idSchema,
  name: z.string().min(1, "Station name is required"),
  capacity: z.number().positive().finite().optional(),
  opening_hours: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().min(-90).max(90).finite().optional(),
      longitude: z.number().min(-180).max(180).finite().optional(),
    })
    .optional(),
})

export const receiveParcelSchema = z.object({
  order_id: idSchema,
})

export const collectParcelSchema = z.object({
  pickup_code: z.string().regex(/^\d{6}$/, "Pickup code must be a 6-digit number"),
})