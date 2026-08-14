import { z } from "zod"
import { idSchema } from "./common"

export const apiKeyPermissionsSchema = z
  .array(z.string().min(1))
  .default([])

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required").max(100),
  permissions: apiKeyPermissionsSchema,
  expires_at: z.string().datetime().optional(),
})

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: apiKeyPermissionsSchema.optional(),
  expires_at: z.string().datetime().optional(),
})

export const apiKeyParamsSchema = z.object({
  keyId: idSchema,
})

export const webhookEventSchema = z.string().min(1)

export const createWebhookSchema = z.object({
  url: z.string().url("A valid URL is required"),
  events: z.array(webhookEventSchema).min(1, "At least one event is required"),
  secret: z.string().min(16, "Webhook secret must be at least 16 characters").optional(),
})

export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(webhookEventSchema).min(1).optional(),
  active: z.boolean().optional(),
  secret: z.string().min(16).optional(),
})

export const webhookParamsSchema = z.object({
  webhookId: idSchema,
})