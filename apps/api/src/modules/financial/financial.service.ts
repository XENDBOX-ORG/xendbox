import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

export async function getOrCreateUserAccount(userId: string) {
  const account = await prisma.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: "USER", owner_id: userId } },
    create: { owner_type: "USER", owner_id: userId },
    update: {},
  })
  return account
}

export async function getOrCreateOrganizationAccount(organizationId: string) {
  const account = await prisma.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: "ORGANIZATION", owner_id: organizationId } },
    create: { owner_type: "ORGANIZATION", owner_id: organizationId },
    update: {},
  })
  return account
}

export async function creditAccount(
  ownerType: "USER" | "ORGANIZATION",
  ownerId: string,
  amount: number
) {
  if (amount <= 0) throw new AppError("Amount must be positive", 400)

  const account = await getOrCreateAccount(ownerType, ownerId)

  const updated = await prisma.financialAccount.update({
    where: { id: account.id },
    data: { balance: { increment: amount } },
  })

  return updated
}

export async function debitAccount(
  ownerType: "USER" | "ORGANIZATION",
  ownerId: string,
  amount: number
) {
  if (amount <= 0) throw new AppError("Amount must be positive", 400)

  const account = await getOrCreateAccount(ownerType, ownerId)
  if (account.balance < amount) throw new AppError("Insufficient balance", 400)

  const updated = await prisma.financialAccount.update({
    where: { id: account.id },
    data: { balance: { decrement: amount } },
  })

  return updated
}

async function getOrCreateAccount(ownerType: string, ownerId: string) {
  const account = await prisma.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: ownerType, owner_id: ownerId } },
    create: { owner_type: ownerType, owner_id: ownerId },
    update: {},
  })
  return account
}

export async function recordRiderEarning(
  riderId: string,
  orderId: string,
  amount: number,
  paymentSource: string
) {
  if (amount <= 0) throw new AppError("Amount must be positive", 400)

  const earning = await prisma.riderEarningRecord.create({
    data: {
      rider_id: riderId,
      order_id: orderId,
      amount,
      payment_source: paymentSource,
    },
    include: {
      order: true,
      rider: {
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
      },
    },
  })

  const rider = await prisma.rider.findUnique({ where: { id: riderId } })
  if (rider?.type === "INDEPENDENT") {
    const user = await prisma.rider.findUnique({ where: { id: riderId } }).user()
    await creditAccount("USER", user.id, amount)
  }

  return earning
}

export async function getRiderEarnings(riderId: string) {
  return prisma.riderEarningRecord.findMany({
    where: { rider_id: riderId },
    include: { order: { select: { tracking_number: true, created_at: true } } },
    orderBy: { created_at: "desc" },
  })
}

export async function getRiderEarningsSummary(riderId: string) {
  const records = await prisma.riderEarningRecord.findMany({
    where: { rider_id: riderId },
  })

  const total = records.reduce((sum, r) => sum + r.amount, 0)
  const count = records.length

  return { total_earned: total, total_deliveries: count }
}
