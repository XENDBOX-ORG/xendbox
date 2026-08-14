import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { requireOrgMember, requireOrgRole } from "../../shared/middleware/org"
import { getParam } from "../../shared/params"
import { parseBody } from "../../shared/validate"
import {
  createApiKeySchema,
  updateApiKeySchema,
  createWebhookSchema,
  updateWebhookSchema,
} from "@xendbox/validation"
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  createWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  listWebhookDeliveries,
} from "./integration.service"
import { AppError } from "../../shared/errors"

const integration = new Hono()

integration.use("/organizations/:orgId/*", authMiddleware, requireOrgMember)
const adminOnly = requireOrgRole("OWNER", "FINANCE_MANAGER", "OPERATIONS_MANAGER")

integration.post("/organizations/:orgId/api-keys", adminOnly, async (c) => {
  try {
    const body = await parseBody(c, createApiKeySchema)
    const result = await createApiKey(getParam(c, "orgId"), body)
    return c.json(result, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.get("/organizations/:orgId/api-keys", async (c) => {
  try {
    const keys = await listApiKeys(getParam(c, "orgId"))
    return c.json(keys)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.delete("/organizations/:orgId/api-keys/:keyId", adminOnly, async (c) => {
  try {
    const result = await revokeApiKey(getParam(c, "orgId"), getParam(c, "keyId"))
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.post("/organizations/:orgId/webhooks", adminOnly, async (c) => {
  try {
    const body = await parseBody(c, createWebhookSchema)
    const webhook = await createWebhook(getParam(c, "orgId"), body)
    return c.json(webhook, 201)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.get("/organizations/:orgId/webhooks", async (c) => {
  try {
    const webhooks = await listWebhooks(getParam(c, "orgId"))
    return c.json(webhooks)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.get("/organizations/:orgId/webhooks/:webhookId/deliveries", async (c) => {
  try {
    const deliveries = await listWebhookDeliveries(getParam(c, "orgId"), getParam(c, "webhookId"))
    return c.json(deliveries)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.patch("/organizations/:orgId/webhooks/:webhookId", adminOnly, async (c) => {
  try {
    const body = await parseBody(c, updateWebhookSchema)
    const webhook = await updateWebhook(getParam(c, "orgId"), getParam(c, "webhookId"), body)
    return c.json(webhook)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

integration.delete("/organizations/:orgId/webhooks/:webhookId", adminOnly, async (c) => {
  try {
    const result = await deleteWebhook(getParam(c, "orgId"), getParam(c, "webhookId"))
    return c.json(result)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default integration