import { z } from "zod"
import { emailSchema, passwordSchema, phoneSchema } from "./common"

export const registerSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: passwordSchema,
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
  })
  .refine((d) => d.email || d.phone, {
    message: "Email or phone is required",
  })

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
})

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
})

export const sendOtpSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  channel: z.enum(["email", "phone"]).optional(),
})

export const verifyOtpSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  code: z.string().regex(/^\d{6}$/, "Code must be a 6-digit number"),
})