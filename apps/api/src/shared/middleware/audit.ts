import type { Context, Next } from "hono"
import { prisma } from "@xendbox/database"
import { sendFireAndForget } from "../notify"

export async function auditMiddleware(c: Context, next: Next) {
  if (c.req.method === "GET" || c.req.method === "HEAD" || c.req.method === "OPTIONS") {
    return next()
  }

  const bodyPromise = safeReadBody(c)

  await next()

  const user = c.get("user")
  const body = await bodyPromise
  const action = `${c.req.method} ${c.req.path}`

  await sendFireAndForget(() =>
    prisma.auditLog.create({
      data: {
        actor_id: user?.sub,
        action,
        entity: c.req.path.split("/")[1] || "root",
        entity_id: c.req.param("id") || undefined,
        metadata: body ? { request_body: body } : undefined,
        ip_address: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || undefined,
        user_agent: c.req.header("user-agent") || undefined,
      },
    })
  )
}

async function safeReadBody(c: Context): Promise<unknown> {
  try {
    const clone = c.req.raw.clone()
    const text = await clone.text()
    if (!text) return undefined
    return JSON.parse(text)
  } catch {
    return undefined
  }
}