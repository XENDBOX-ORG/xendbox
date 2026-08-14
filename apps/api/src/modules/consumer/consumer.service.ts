import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"

export async function createConsumer(userId: string, type: "INDIVIDUAL" | "MERCHANT") {
  const existing = await prisma.consumer.findUnique({ where: { user_id: userId } })
  if (existing) throw new AppError("Consumer profile already exists", 409)

  const consumer = await prisma.consumer.create({
    data: { user_id: userId, type },
    include: { user: { select: { id: true, email: true, phone: true, first_name: true, last_name: true } } },
  })

  return consumer
}

export async function getConsumerByUserId(userId: string) {
  const consumer = await prisma.consumer.findUnique({
    where: { user_id: userId },
    include: {
      merchant_profile: true,
      recipients: { include: { address: true } },
    },
  })

  if (!consumer) throw new AppError("Consumer profile not found", 404)
  return consumer
}

export async function getConsumerById(id: string) {
  const consumer = await prisma.consumer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, phone: true, first_name: true, last_name: true, avatar: true } },
      merchant_profile: true,
      recipients: { include: { address: true } },
    },
  })

  if (!consumer) throw new AppError("Consumer not found", 404)
  return consumer
}
