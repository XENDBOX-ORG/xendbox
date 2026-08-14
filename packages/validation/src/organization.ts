import { z } from "zod"
import { addressSchema, idSchema } from "./common"

export const organizationTypeSchema = z.enum(["MERCHANT", "LOGISTICS_COMPANY", "PICKUP_STATION"])

export const memberRoleSchema = z.enum([
  "OWNER",
  "STAFF",
  "OPERATIONS_MANAGER",
  "DISPATCHER",
  "FINANCE_MANAGER",
  "RIDER",
  "MANAGER",
  "OPERATOR",
])

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: organizationTypeSchema,
  address: addressSchema,
})

export const addMemberSchema = z.object({
  user_id: idSchema,
  role: memberRoleSchema,
})

export const createMerchantProfileSchema = z.object({
  organization_id: idSchema,
  business_name: z.string().min(1, "Business name is required"),
  category: z.string().optional(),
  registration_number: z.string().optional(),
})