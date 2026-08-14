import type { Context, Next } from "hono"
import { prisma } from "@xendbox/database"
import { AppError } from "../errors"

export interface OrgMemberContext {
  organization_id: string
  user_id: string
  role: string
  status: string
}

declare module "hono" {
  interface ContextVariableMap {
    orgMember: OrgMemberContext
  }
}

function orgIdFromRequest(c: Context): string {
  const param = c.req.param("orgId") || c.req.param("id")
  if (param) return param
  const query = c.req.query("orgId")
  if (query) return query
  throw new AppError("Organization ID not found in request", 400)
}

export async function requireOrgMember(c: Context, next: Next) {
  const user = c.get("user")
  const organization_id = orgIdFromRequest(c)

  const member = await prisma.organizationMember.findUnique({
    where: {
      organization_id_user_id: {
        organization_id,
        user_id: user.sub,
      },
    },
  })

  if (!member || member.status !== "ACTIVE") {
    throw new AppError("You do not have access to this organization", 403)
  }

  c.set("orgMember", member)
  await next()
}

export function requireOrgRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const member = c.get("orgMember")
    if (!member || !roles.includes(member.role)) {
      throw new AppError("You do not have permission to perform this action", 403)
    }
    await next()
  }
}

export async function assertOrgAccess(userId: string, organizationId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: {
      organization_id_user_id: {
        organization_id: organizationId,
        user_id: userId,
      },
    },
  })

  if (!member || member.status !== "ACTIVE") {
    throw new AppError("You do not have access to this organization", 403)
  }

  return member
}

export async function requireStationOrgMember(c: Context, next: Next) {
  const user = c.get("user")
  const stationId = c.req.param("id")
  const station = await prisma.pickupStation.findUnique({
    where: { id: stationId },
    select: { organization_id: true },
  })

  if (!station) throw new AppError("Pickup station not found", 404)

  await assertOrgAccess(user.sub, station.organization_id)
  await next()
}

export async function getOrgParam(c: Context): Promise<string> {
  const user = c.get("user")
  const organization_id = orgIdFromRequest(c)

  const member = await prisma.organizationMember.findUnique({
    where: {
      organization_id_user_id: {
        organization_id,
        user_id: user.sub,
      },
    },
  })

  if (!member || member.status !== "ACTIVE") {
    throw new AppError("You do not have access to this organization", 403)
  }

  return organization_id
}