import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"

export async function getPlatformStats(from?: Date, to?: Date) {
  const where = from && to ? { created_at: { gte: from, lte: to } } : undefined

  const [totalUsers, activeUsers, totalOrgs, totalOrders, deliveredOrders, totalRiders, totalStations] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.organization.count(),
      prisma.order.count({ where: where ?? {} }),
      prisma.order.count({
        where: { status: "DELIVERED", ...(where ?? {}) },
      }),
      prisma.rider.count(),
      prisma.pickupStation.count(),
    ])

  const revenueAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "SUCCESSFUL", ...(where ?? {}) },
  })

  return {
    users: { total: totalUsers, active: activeUsers },
    organizations: totalOrgs,
    orders: { total: totalOrders, delivered: deliveredOrders },
    riders: totalRiders,
    stations: totalStations,
    revenue: revenueAgg._sum.amount ?? 0,
  }
}

export async function listAdminUsers(
  page: number,
  limit: number,
  filters: { role?: "USER" | "ADMIN"; status?: "ACTIVE" | "SUSPENDED" | "BANNED" }
) {
  const where = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        status: true,
        role: true,
        is_verified: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return { items, total, page, limit }
}

export async function updateAdminUser(userId: string, data: { status?: string; role?: string }) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) throw new AppError("User not found", 404)

  const user = await prisma.user.update({
    where: { id: userId },
    data: data as { status: "BANNED" | "ACTIVE" | "SUSPENDED"; role: "USER" | "ADMIN" },
    select: {
      id: true,
      email: true,
      phone: true,
      first_name: true,
      last_name: true,
      status: true,
      role: true,
      is_verified: true,
      created_at: true,
    },
  })

  return user
}

export async function listAdminOrganizations(page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        created_at: true,
        _count: { select: { members: true, riders: true, pickup_stations: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organization.count(),
  ])

  return { items, total, page, limit }
}

export async function suspendOrganization(orgId: string) {
  const updated = await prisma.organization.updateMany({
    where: { id: orgId, status: "ACTIVE" },
    data: { status: "SUSPENDED" },
  })
  if (updated.count === 0) throw new AppError("Active organization not found", 404)
  return { message: "Organization suspended" }
}