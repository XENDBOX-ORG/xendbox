import type { Context, Next } from "hono"
import { authenticateApiKey } from "../../modules/integration/integration.service"

declare module "hono" {
  interface ContextVariableMap {
    apiKey: {
      id: string
      organization_id: string
      name: string
      permissions: { allow?: string[] } | null
    }
  }
}

export async function apiKeyMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization")
  const key = header?.startsWith("Bearer ") ? header.slice(7) : c.req.query("api_key")

  if (!key) {
    return c.json({ error: "Missing API key" }, 401)
  }

  const apiKey = await authenticateApiKey(key)
  if (!apiKey) {
    return c.json({ error: "Invalid or expired API key" }, 401)
  }

  c.set("apiKey", {
    id: apiKey.id,
    organization_id: apiKey.organization_id,
    name: apiKey.name,
    permissions: apiKey.permissions as { allow?: string[] } | null,
  })

  await next()
}

export function requireApiKeyPermission(permission: string) {
  return async (c: Context, next: Next) => {
    const apiKey = c.get("apiKey")
    const allowed = apiKey?.permissions?.allow
    if (!allowed || !allowed.includes(permission)) {
      return c.json({ error: `Missing API key permission: ${permission}` }, 403)
    }
    await next()
  }
}