import { prisma } from "@xendbox/database"
import { AppError } from "../identity/auth.service"

export async function createRecipient(
  consumerId: string,
  data: {
    name: string
    phone: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      latitude?: number
      longitude?: number
    }
  }
) {
  const recipient = await prisma.recipient.create({
    data: {
      consumer_id: consumerId,
      name: data.name,
      phone: data.phone,
      address: data.address
        ? {
            create: data.address,
          }
        : undefined,
    },
    include: { address: true },
  })

  return recipient
}

export async function listRecipients(consumerId: string) {
  return prisma.recipient.findMany({
    where: { consumer_id: consumerId },
    include: { address: true },
    orderBy: { created_at: "desc" },
  })
}

export async function getRecipientById(id: string, consumerId: string) {
  const recipient = await prisma.recipient.findFirst({
    where: { id, consumer_id: consumerId },
    include: { address: true },
  })

  if (!recipient) throw new AppError("Recipient not found", 404)
  return recipient
}

export async function updateRecipient(
  id: string,
  consumerId: string,
  data: {
    name?: string
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      latitude?: number
      longitude?: number
    }
  }
) {
  const existing = await prisma.recipient.findFirst({
    where: { id, consumer_id: consumerId },
  })
  if (!existing) throw new AppError("Recipient not found", 404)

  const recipient = await prisma.recipient.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      address: data.address
        ? {
            upsert: {
              create: data.address,
              update: data.address,
            },
          }
        : undefined,
    },
    include: { address: true },
  })

  return recipient
}

export async function deleteRecipient(id: string, consumerId: string) {
  const existing = await prisma.recipient.findFirst({
    where: { id, consumer_id: consumerId },
  })
  if (!existing) throw new AppError("Recipient not found", 404)

  await prisma.recipient.delete({ where: { id } })
  return { message: "Recipient deleted" }
}
