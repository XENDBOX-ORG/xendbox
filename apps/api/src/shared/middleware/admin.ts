import type { Context, Next } from "hono"
import { prisma } from "@xendbox/database"
import { AppError } from "../errors"

export async function requireAdmin(c: Context, next: Next) {
  const user = c.get("user")
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { role: true, status: true },
  })

  if (!dbUser || dbUser.role !== "ADMIN" || dbUser.status !== "ACTIVE") {
    throw new AppError("Admin access required", 403)
  }

  await next()
}