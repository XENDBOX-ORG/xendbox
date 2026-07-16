import type { Context, Next } from "hono"
import { verifyAccessToken } from "@xendbox/auth"
import type { JwtPayload } from "@xendbox/types"

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization")
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401)
  }

  const token = header.slice(7)
  try {
    const payload = verifyAccessToken(token)
    c.set("user", payload)
    await next()
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401)
  }
}
