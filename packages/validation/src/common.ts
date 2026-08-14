import { z } from "zod"

export const idSchema = z.string().uuid("Invalid ID")

export const orgIdQuerySchema = z.object({
  orgId: idSchema,
})

export const emailSchema = z.string().email("Invalid email")

export const phoneSchema = z.string().min(7, "Invalid phone number").max(20)

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters")

export const addressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().min(-90).max(90).finite().optional(),
    longitude: z.number().min(-180).max(180).finite().optional(),
  })
  .optional()