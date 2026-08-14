import crypto from "node:crypto"
import {
  type FinancialProvider,
  type NameEnquiryRequest,
  type NameEnquiryResult,
  type PayoutRequest,
  type PayoutResult,
  type PayoutVerificationRequest,
  type TransactionVerificationRequest,
  type VerifiedTransaction,
  type VirtualAccountRequest,
  type VirtualAccountResult,
  ProviderError,
} from "./provider"

const MONNIFY_API_URL = process.env.MONNIFY_API_URL || "https://api.monnify.com"
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || ""
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ""
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || ""
const MONNIFY_WALLET_ACCOUNT_NUMBER = process.env.MONNIFY_WALLET_ACCOUNT_NUMBER || ""

const REQUEST_TIMEOUT_MS = 10_000

interface MonnifyResponse<T> {
  requestSuccessful: boolean
  responseMessage?: string
  responseCode?: number
  responseBody?: T
}

let cachedToken: { token: string; expiresAt: number } | null = null

/** Provider amounts arrive as integer kobo (number or string); normalise to BigInt. */
function providerKobo(value: number | string | bigint | null | undefined): bigint {
  if (value == null) return 0n
  if (typeof value === "bigint") return value
  return BigInt(value)
}

function isConfigured(): boolean {
  return Boolean(MONNIFY_API_KEY && MONNIFY_SECRET_KEY)
}

function requireConfigured(): void {
  if (!isConfigured()) {
    throw new ProviderError(
      "Monnify is not configured (MONNIFY_API_KEY/MONNIFY_SECRET_KEY missing)",
      "MONNIFY"
    )
  }
}

async function monnifyRequest<T>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; auth?: string } = {}
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (options.token) headers.Authorization = `Bearer ${options.token}`
    if (options.auth) headers.Authorization = options.auth

    const res = await fetch(`${MONNIFY_API_URL}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    const json = (await res.json()) as MonnifyResponse<T>
    if (!res.ok || json.requestSuccessful === false) {
      throw new ProviderError(
        json.responseMessage || `Monnify request failed with status ${res.status}`,
        "MONNIFY",
        res.status
      )
    }
    return json.responseBody as T
  } catch (err) {
    if (err instanceof ProviderError) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw new ProviderError(`Monnify request failed: ${message}`, "MONNIFY")
  } finally {
    clearTimeout(timer)
  }
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token
  }
  requireConfigured()
  const auth = `Basic ${Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString("base64")}`
  const body = await monnifyRequest<{ accessToken: string; expiresIn: number }>(
    "POST",
    "/api/v1/auth/login",
    { auth, body: {} }
  )
  const token = body?.accessToken
  if (!token) throw new ProviderError("Monnify did not return an access token", "MONNIFY")
  const expiresIn = body.expiresIn || 1800
  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 }
  return token
}

export const monnify: FinancialProvider = {
  name: "MONNIFY",

  async createVirtualAccount(request: VirtualAccountRequest): Promise<VirtualAccountResult> {
    requireConfigured()
    if (!MONNIFY_CONTRACT_CODE) {
      throw new ProviderError("MONNIFY_CONTRACT_CODE is not configured", "MONNIFY")
    }
    const token = await getAccessToken()
    const body = await monnifyRequest<any>(
      "POST",
      "/api/v2/bank-transfer/reserved-accounts",
      {
        token,
        body: {
          accountReference: request.accountReference,
          accountName: request.accountName,
          currencyCode: "NGN",
          contractCode: MONNIFY_CONTRACT_CODE,
          customerEmail: request.customerEmail,
          getAllAvailableBanks: true,
          accountType: "RESERVED",
        },
      }
    )

    const account = Array.isArray(body?.accounts)
      ? body.accounts[0]
      : body

    if (!account?.accountNumber) {
      throw new ProviderError("Monnify did not return a virtual account", "MONNIFY")
    }

    return {
      accountReference: request.accountReference,
      accountNumber: account.accountNumber,
      accountName: account.accountName || request.accountName,
      bankName: account.bankName,
      bankCode: account.bankCode,
      status: "ACTIVE",
    }
  },

  async verifyTransaction(request: TransactionVerificationRequest): Promise<VerifiedTransaction> {
    requireConfigured()
    if (!request.paymentReference && !request.transactionReference) {
      throw new ProviderError("A payment or transaction reference is required", "MONNIFY")
    }
    const token = await getAccessToken()
    const params = new URLSearchParams({ page: "0", size: "1" })
    if (request.paymentReference) params.set("paymentReference", request.paymentReference)
    if (request.transactionReference) params.set("transactionReference", request.transactionReference)

    const body = await monnifyRequest<{ content?: any[] }>(
      "GET",
      `/api/v2/transactions/search?${params.toString()}`,
      { token }
    )
    const tx = body?.content?.[0]
    if (!tx) {
      throw new ProviderError("Monnify transaction not found", "MONNIFY", 404)
    }

    return {
      transactionReference: tx.transactionReference,
      paymentReference: tx.paymentReference,
      amountKobo: providerKobo(tx.amountPaid),
      currency: tx.currency || "NGN",
      status: tx.paymentStatus || tx.status || "",
      settlementStatus: tx.settlementStatus,
      paymentMethod: tx.paymentMethod,
      paidOn: tx.paidOn,
      accountNumber: tx.accountNumber,
      bankName: tx.bankName,
    }
  },

  async nameEnquiry(request: NameEnquiryRequest): Promise<NameEnquiryResult> {
    requireConfigured()
    const token = await getAccessToken()
    const body = await monnifyRequest<any>("POST", "/api/v2/disbursements/name-enquiry", {
      token,
      body: {
        destinationBankCode: request.bankCode,
        destinationAccountNumber: request.accountNumber,
      },
    })
    if (!body?.accountName) {
      throw new ProviderError("Monnify name enquiry returned no account name", "MONNIFY")
    }
    return {
      accountName: body.accountName,
      accountNumber: body.accountNumber || request.accountNumber,
      bankCode: body.bankCode || request.bankCode,
    }
  },

  async initiatePayout(request: PayoutRequest): Promise<PayoutResult> {
    requireConfigured()
    if (!MONNIFY_WALLET_ACCOUNT_NUMBER) {
      throw new ProviderError("MONNIFY_WALLET_ACCOUNT_NUMBER is not configured", "MONNIFY")
    }
    const token = await getAccessToken()
    const body = await monnifyRequest<any>("POST", "/api/v2/disbursements/single", {
      token,
      body: {
        amount: request.amountKobo.toString(),
        transactionReference: request.transactionReference,
        destinationBankCode: request.destinationBankCode,
        destinationAccountNumber: request.destinationAccountNumber,
        currency: "NGN",
        narration: request.narration || "Xendbox payout",
        sourceAccountNumber: MONNIFY_WALLET_ACCOUNT_NUMBER,
      },
    })
    if (!body?.transactionReference) {
      throw new ProviderError("Monnify did not return a payout reference", "MONNIFY")
    }
    return {
      transactionReference: body.transactionReference,
      status: body.status || "PENDING",
      providerMessage: body.statusMessage || body.responseMessage,
    }
  },

  async verifyPayout(request: PayoutVerificationRequest): Promise<VerifiedTransaction> {
    requireConfigured()
    if (!request.paymentReference && !request.transactionReference) {
      throw new ProviderError("A payment or transaction reference is required", "MONNIFY")
    }
    const token = await getAccessToken()
    const params = new URLSearchParams({ page: "0", size: "1" })
    if (request.paymentReference) params.set("paymentReference", request.paymentReference)
    if (request.transactionReference) params.set("transactionReference", request.transactionReference)

    const body = await monnifyRequest<{ content?: any[] }>(
      "GET",
      `/api/v2/transactions/search?${params.toString()}`,
      { token }
    )
    const tx = body?.content?.[0]
    if (!tx) {
      throw new ProviderError("Monnify payout transaction not found", "MONNIFY", 404)
    }
    return {
      transactionReference: tx.transactionReference,
      paymentReference: tx.paymentReference,
      amountKobo: providerKobo(tx.amountPaid),
      currency: tx.currency || "NGN",
      status: tx.paymentStatus || tx.status || "",
      settlementStatus: tx.settlementStatus,
      paymentMethod: tx.paymentMethod,
      paidOn: tx.paidOn,
    }
  },

  verifyWebhookSignature(signature: string, body: string): boolean {
    const hash = crypto
      .createHmac("sha512", MONNIFY_SECRET_KEY)
      .update(body)
      .digest("hex")
    return typeof signature === "string" && signature.length > 0 && hash === signature
  },
}
