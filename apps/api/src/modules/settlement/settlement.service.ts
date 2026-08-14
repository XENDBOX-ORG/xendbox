import { SettlementItemType } from "@prisma/client"
import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"

export async function generateSettlement(organizationId: string, period?: string) {
  const periodValue = period || new Date().toISOString().slice(0, 7)

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.findUnique({ where: { id: organizationId } })
    if (!org) throw new AppError("Organization not found", 404)

    const existing = await tx.settlement.findFirst({
      where: { organization_id: organizationId, period: periodValue, status: { not: "CANCELLED" } },
    })
    if (existing) throw new AppError("Settlement already generated for this period", 409)

    const settledOrderIds = await tx.settlementItem.findMany({
      where: { settlement: { organization_id: organizationId } },
      select: { order_id: true },
    })
    const settledSet = new Set(settledOrderIds.map((i) => i.order_id))

    const completedOrders = await tx.order.findMany({
      where: {
        status: "DELIVERED",
        dispatch: {
          assigned_rider: {
            organization_id: organizationId,
          },
        },
      },
      include: {
        dispatch: {
          include: { assigned_rider: true },
        },
      },
    })

    const pendingOrders = completedOrders.filter((o) => !settledSet.has(o.id))
    if (pendingOrders.length === 0) throw new AppError("No completed orders to settle", 400)

    let totalAmount = 0
    const items: { order_id: string; amount: number; type: SettlementItemType }[] = []

    for (const order of pendingOrders) {
      const riderPayment = order.price * 0.8
      const platformFee = order.price * 0.2

      items.push({
        order_id: order.id,
        amount: riderPayment,
        type: SettlementItemType.RIDER_PAYMENT,
      })

      items.push({
        order_id: order.id,
        amount: platformFee,
        type: SettlementItemType.PLATFORM_FEE,
      })

      totalAmount += order.price
    }

    const settlement = await tx.settlement.create({
      data: {
        organization_id: organizationId,
        amount: totalAmount,
        period: periodValue,
        items: {
          create: items,
        },
      },
      include: { items: true },
    })

    return settlement
  })
}

export async function listSettlements(organizationId: string) {
  return prisma.settlement.findMany({
    where: { organization_id: organizationId },
    orderBy: { created_at: "desc" },
  })
}

export async function getSettlement(id: string, organizationId: string) {
  const settlement = await prisma.settlement.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      items: {
        include: {
          order: { select: { tracking_number: true, created_at: true } },
        },
      },
    },
  })

  if (!settlement) throw new AppError("Settlement not found", 404)
  return settlement
}
