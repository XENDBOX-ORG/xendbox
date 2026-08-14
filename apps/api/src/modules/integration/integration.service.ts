import { prisma } from "@xendbox/database"
import crypto from "node:crypto"
import { AppError } from "../../shared/errors"

const API_KEY_PREFIX = "xnd_"
const API_KEY_BYTES = 32

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex")
}

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `${API_KEY_PREFIX}${crypto.randomBytes(API_KEY_BYTES).toString("base64url")}`
  return {
    key,
    hash: hashKey(key),
    prefix: key.slice(0, 10),
  }
}

export async function createApiKey(
  organizationId: string,
  data: { name: string; permissions?: string[]; expires_at?: string }
) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org) throw new AppError("Organization not found", 404)

  const { key, hash, prefix } = generateApiKey()

  await prisma.apiKey.create({
    data: {
      organization_id: organizationId,
      name: data.name,
      key_hash: hash,
      prefix,
      permissions: data.permissions?.length ? { allow: data.permissions } : undefined,
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
    },
  })

  return {
    message: "API key created. Store it now; it will not be shown again.",
    key,
    prefix,
  }
}

export async function listApiKeys(organizationId: string) {
  return prisma.apiKey.findMany({
    where: { organization_id: organizationId, revoked_at: null },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      expires_at: true,
      created_at: true,
      revoked_at: true,
    },
    orderBy: { created_at: "desc" },
  })
}

export async function revokeApiKey(organizationId: string, keyId: string) {
  const updated = await prisma.apiKey.updateMany({
    where: { id: keyId, organization_id: organizationId },
    data: { revoked_at: new Date() },
  })
  if (updated.count === 0) throw new AppError("API key not found", 404)
  return { message: "API key revoked" }
}

export async function createWebhook(
  organizationId: string,
  data: { url: string; events: string[]; secret?: string }
) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org) throw new AppError("Organization not found", 404)

  const webhook = await prisma.webhook.create({
    data: {
      organization_id: organizationId,
      url: data.url,
      events: data.events,
      secret: data.secret,
    },
  })

  return webhook
}

export async function listWebhooks(organizationId: string) {
  return prisma.webhook.findMany({
    where: { organization_id: organizationId },
    orderBy: { created_at: "desc" },
  })
}

export async function updateWebhook(
  organizationId: string,
  webhookId: string,
  data: { url?: string; events?: string[]; active?: boolean; secret?: string }
) {
  const updated = await prisma.webhook.updateMany({
    where: { id: webhookId, organization_id: organizationId },
    data,
  })
  if (updated.count === 0) throw new AppError("Webhook not found", 404)

  return prisma.webhook.findUniqueOrThrow({ where: { id: webhookId } })
}

export async function deleteWebhook(organizationId: string, webhookId: string) {
  const deleted = await prisma.webhook.deleteMany({
    where: { id: webhookId, organization_id: organizationId },
  })
  if (deleted.count === 0) throw new AppError("Webhook not found", 404)
  return { message: "Webhook deleted" }
}

export async function listWebhookDeliveries(organizationId: string, webhookId: string) {
  const webhook = await prisma.webhook.findFirst({
    where: { id: webhookId, organization_id: organizationId },
  })
  if (!webhook) throw new AppError("Webhook not found", 404)

  return prisma.webhookDelivery.findMany({
    where: { webhook_id: webhookId },
    orderBy: { created_at: "desc" },
    take: 50,
  })
}

export async function authenticateApiKey(key: string) {
  const keyHash = hashKey(key)
  const apiKey = await prisma.apiKey.findUnique({
    where: { key_hash: keyHash },
    include: { organization: true },
  })
  if (!apiKey) return null
  if (apiKey.revoked_at) return null
  if (apiKey.expires_at && apiKey.expires_at < new Date()) return null

  return apiKey
}

export { hashKey }