import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

export async function createOrganization(data: {
  name: string
  type: "MERCHANT" | "LOGISTICS_COMPANY" | "PICKUP_STATION"
  user_id: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    latitude?: number
    longitude?: number
  }
}) {
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      type: data.type,
      address: data.address
        ? {
            create: data.address,
          }
        : undefined,
      members: {
        create: {
          user_id: data.user_id,
          role: "OWNER",
        },
      },
    },
    include: {
      address: true,
      members: true,
    },
  })

  return org
}

export async function getOrganizationById(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      address: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
        },
      },
    },
  })

  if (!org) throw new AppError("Organization not found", 404)
  return org
}

export async function addOrganizationMember(data: {
  organization_id: string
  user_id: string
  role: string
}) {
  const existing = await prisma.organizationMember.findUnique({
    where: {
      organization_id_user_id: {
        organization_id: data.organization_id,
        user_id: data.user_id,
      },
    },
  })

  if (existing) throw new AppError("User is already a member", 409)

  const member = await prisma.organizationMember.create({
    data: {
      organization_id: data.organization_id,
      user_id: data.user_id,
      role: data.role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  })

  return member
}

export async function listOrganizationMembers(organization_id: string) {
  return prisma.organizationMember.findMany({
    where: { organization_id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          avatar: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  })
}
