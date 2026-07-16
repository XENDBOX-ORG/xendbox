import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

export async function generateSettlement(organizationId: string, period?: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org) throw new AppError("Organization not found", 404)

  const completedOrders = await prisma.order.findMany({
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

  if (completedOrders.length === 0) throw new AppError("No completed orders to settle", 400)

  let totalAmount = 0
  const items: { order_id: string; amount: number; type: string }[] = []

  for (const order of completedOrders) {
    const riderPayment = order.price * 0.8
    const platformFee = order.price * 0.2

    items.push({
      order_id: order.id,
      amount: riderPayment,
      type: "RIDER_PAYMENT",
    })

    items.push({
      order_id: order.id,
      amount: platformFee,
      type: "PLATFORM_FEE",
    })

    totalAmount += order.price
  }

  const settlement = await prisma.settlement.create({
    data: {
      organization_id: organizationId,
      amount: totalAmount,
      period: period || new Date().toISOString().slice(0, 7),
      items: {
        create: items,
      },
    },
    include: { items: true },
  })

  return settlement
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
