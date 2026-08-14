import { prisma } from "@xendbox/database"
import type { Prisma } from "@prisma/client"
import crypto from "node:crypto"

const integrationSecret =
  process.env.WEBHOOK_DISPATCH_SECRET || ""

function createSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

export async function dispatchWebhook(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      organization_id: organizationId,
      active: true,
      events: { array_contains: [event] },
    },
  })

  for (const webhook of webhooks) {
    await sendFireAndForgetWebhook(webhook.id, webhook.url, webhook.secret, event, payload)
  }
}

async function sendFireAndForgetWebhook(
  webhookId: string,
  url: string,
  secret: string | null,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      event,
      created_at: new Date().toISOString(),
      data: payload,
    })

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "xendbox-webhook/1.0",
    }
    if (secret && integrationSecret) {
      headers["X-Webhook-Signature"] = createSignature(body, `${integrationSecret}:${secret}`)
    } else if (secret) {
      headers["X-Webhook-Signature"] = createSignature(body, secret)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal })
    clearTimeout(timer)

    await prisma.webhookDelivery.create({
      data: {
        webhook_id: webhookId,
        event,
        payload: payload as Prisma.InputJsonValue,
        status_code: res.status,
        attempts: 1,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.webhookDelivery.create({
      data: {
        webhook_id: webhookId,
        event,
        payload: payload as Prisma.InputJsonValue,
        attempts: 1,
        error: message.slice(0, 1000),
      },
    })
  }
}