import crypto from "node:crypto"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_BASE = "https://api.paystack.co"

interface PaystackResponse {
  status: boolean
  message: string
  data?: any
}

async function callPaystack(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<PaystackResponse> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function initializeTransaction(data: {
  email: string
  amount: number
  reference?: string
  metadata?: Record<string, unknown>
}) {
  return callPaystack("POST", "/transaction/initialize", {
    email: data.email,
    amount: Math.round(data.amount * 100),
    reference: data.reference,
    metadata: data.metadata,
  })
}

export async function verifyTransaction(reference: string) {
  return callPaystack("GET", `/transaction/verify/${reference}`)
}

export function verifyWebhookSignature(signature: string, body: string): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex")
  return hash === signature
}
