import { z } from "zod"

export const adminStatsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const adminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
})

export const adminListOrgsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const adminUserParamsSchema = z.object({
  userId: z.string().uuid("Invalid ID"),
})

export const adminOrgParamsSchema = z.object({
  orgId: z.string().uuid("Invalid ID"),
})

export const adminUpdateUserSchema = z
  .object({
    status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
  })
  .refine((v) => v.status !== undefined || v.role !== undefined, {
    message: "Provide at least one field to update",
  })