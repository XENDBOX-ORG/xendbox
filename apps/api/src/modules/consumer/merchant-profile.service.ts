import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"
import { sendWelcomeEmail } from "../../shared/notify"

export async function createMerchantProfile(
  consumerId: string,
  data: {
    organization_id: string
    business_name: string
    category?: string
    registration_number?: string
  }
) {
  const existing = await prisma.merchantProfile.findUnique({ where: { consumer_id: consumerId } })
  if (existing) throw new AppError("Merchant profile already exists", 409)

  const org = await prisma.organization.findUnique({ where: { id: data.organization_id } })
  if (!org) throw new AppError("Organization not found", 404)

  const profile = await prisma.merchantProfile.create({
    data: {
      consumer_id: consumerId,
      organization_id: data.organization_id,
      business_name: data.business_name,
      category: data.category,
      registration_number: data.registration_number,
    },
    include: { organization: true },
  })

  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    select: { user_id: true },
  })
  if (consumer) sendWelcomeEmail(consumer.user_id, "merchant")

  return profile
}

export async function getMerchantProfile(consumerId: string) {
  const profile = await prisma.merchantProfile.findUnique({
    where: { consumer_id: consumerId },
    include: { organization: true },
  })

  if (!profile) throw new AppError("Merchant profile not found", 404)
  return profile
}
