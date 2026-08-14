import { prisma } from "@xendbox/database"
import crypto from "node:crypto"
import { initializeTransaction, verifyTransaction } from "../../lib/paystack"
import { AppError } from "../../shared/errors"
import { cancelOrderExpiry } from "../../jobs"
import { toKobo } from "../../lib/money"
import {
  getOrCreateAccountForOwner,
  reserveForOrder,
  creditAvailable,
  reverseFunding,
} from "../financial/financial.service"
import { confirmWithdrawalOutcome } from "../withdrawal/withdrawal.service"

export async function initializeWalletFunding(
  userId: string,
  email: string,
  amount: number
) {
  if (amount <= 0) throw new AppError("Amount must be positive", 400)

  const reference = `WALLET_${userId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`

  const result = await initializeTransaction({
    email,
    amount,
    reference,
    metadata: { user_id: userId, type: "wallet_funding" },
  })

  if (!result.status) {
    throw new AppError(result.message || "Failed to initialize payment", 500)
  }

  await prisma.payment.create({
    data: {
      amount,
      provider: "PAYSTACK",
      provider_reference: reference,
      status: "PENDING",
      metadata: { type: "wallet_funding", user_id: userId },
    },
  })

  return {
    authorization_url: result.data.authorization_url,
    reference,
    access_code: result.data.access_code,
  }
}

export async function verifyWalletFunding(reference: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: { provider_reference: reference },
  })
  if (!payment) throw new AppError("Payment not found", 404)

  const metadata = payment.metadata as { type?: string; user_id?: string } | null
  if (metadata?.type !== "wallet_funding" || !metadata?.user_id) {
    throw new AppError("Not a wallet funding payment", 400)
  }
  if (metadata.user_id !== userId) {
    throw new AppError("Payment does not belong to this user", 403)
  }

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PROCESSING" },
  })
  if (claimed.count === 0) {
    throw new AppError("Payment already verified", 400)
  }

  const result = await verifyTransaction(reference)
  if (!result.status || result.data.status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    })
    throw new AppError("Payment verification failed", 400)
  }

  await prisma.$transaction(async (tx) => {
    const account = await getOrCreateAccountForOwner(tx, "USER", metadata.user_id!)
    await creditAvailable(tx, account.id, toKobo(payment.amount), {
      reference: `FUND_${reference}`,
      source: "PAYSTACK_FUNDING",
      providerReference: reference,
    })
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        metadata: { ...(metadata || {}), paystack_data: result.data },
      },
    })
  })

  return { message: "Wallet funded successfully" }
}

export async function initializeOrderPayment(
  userId: string,
  email: string,
  orderId: string,
  consumerId: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
  })
  if (!order) throw new AppError("Order not found", 404)
  if (order.payment_status !== "PENDING") throw new AppError("Order already paid", 400)

  const reference = `ORDER_${orderId}_${Date.now()}`

  const result = await initializeTransaction({
    email,
    amount: order.price,
    reference,
    metadata: { user_id: userId, order_id: orderId, type: "order_payment" },
  })

  if (!result.status) {
    throw new AppError(result.message || "Failed to initialize payment", 500)
  }

  await prisma.payment.create({
    data: {
      order_id: orderId,
      amount: order.price,
      provider: "PAYSTACK",
      provider_reference: reference,
      status: "PENDING",
      metadata: { type: "order_payment", user_id: userId },
    },
  })

  return {
    authorization_url: result.data.authorization_url,
    reference,
    access_code: result.data.access_code,
  }
}

export async function verifyOrderPayment(reference: string) {
  const payment = await prisma.payment.findFirst({
    where: { provider_reference: reference },
  })
  if (!payment || !payment.order_id) throw new AppError("Payment not found", 404)

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PROCESSING" },
  })
  if (claimed.count === 0) {
    throw new AppError("Payment already verified", 400)
  }

  const result = await verifyTransaction(reference)
  if (!result.status || result.data.status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    })
    throw new AppError("Payment verification failed", 400)
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS" },
    }),
    prisma.order.update({
      where: { id: payment.order_id },
      data: {
        status: "PAID",
        payment_status: "PAID",
        events: {
          create: {
            event_type: "PAYMENT_COMPLETED",
            metadata: { provider: "PAYSTACK", reference },
          },
        },
      },
    }),
  ])

  await cancelOrderExpiry(payment.order_id)

  return { message: "Order payment successful" }
}

export async function payOrderFromWallet(orderId: string, consumerId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, consumer_id: consumerId },
    })
    if (!order) throw new AppError("Order not found", 404)
    if (order.payment_status !== "PENDING") throw new AppError("Order already paid", 400)

    const account = await getOrCreateAccountForOwner(tx, "USER", userId)
    await reserveForOrder(tx, account.id, order.id, toKobo(order.price), "ORDER_PAYMENT")

    const payment = await tx.payment.create({
      data: {
        order_id: orderId,
        amount: order.price,
        provider: "WALLET",
        status: "SUCCESS",
      },
    })

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        payment_status: "PAID",
        events: {
          create: {
            event_type: "PAYMENT_COMPLETED",
            metadata: { provider: "WALLET", payment_id: payment.id },
          },
        },
      },
    })

    await cancelOrderExpiry(orderId)

    return { message: "Order paid from wallet", reserved: true }
  })
}

export async function handlePaystackWebhook(event: string, data: any) {
  if (event !== "charge.success") return

  const reference = data.reference
  const metadata = data.metadata || {}

  if (metadata.type === "wallet_funding") {
    const payment = await prisma.payment.findFirst({
      where: { provider_reference: reference },
      select: { metadata: true },
    })
    const userId = (payment?.metadata as { user_id?: string } | null)?.user_id
    if (!userId) return
    await verifyWalletFunding(reference, userId)
  } else if (metadata.type === "order_payment") {
    await verifyOrderPayment(reference)
  }
}

// ---------------------------------------------------------------------------
// Monnify virtual-account webhooks
// ---------------------------------------------------------------------------

type MonnifyWebhookPayload = {
  eventType?: string
  eventData?: Record<string, any>
}

export async function handleMonnifyWebhook(payload: MonnifyWebhookPayload) {
  const { eventType, eventData } = payload
  if (!eventType || !eventData) return { handled: false }

  switch (eventType) {
    case "SUCCESSFUL_TRANSACTION":
    case "COLLECTION_SUCCESS":
      return { handled: true, result: await processMonnifyCollection(eventData) }
    case "SUCCESSFUL_TRANSACTION_REVERSED":
    case "TRANSACTION_REVERSED":
      return { handled: true, result: await processMonnifyCollectionReversal(eventData) }
    case "DISBURSEMENT_SUCCESSFUL":
    case "DISBURSEMENT_FAILED":
      return { handled: true, result: await processMonnifyPayout(eventType, eventData) }
    default:
      return { handled: false }
  }
}

async function processMonnifyCollection(eventData: Record<string, any>) {
  const txnRef = eventData?.transactionReference as string | undefined
  const accountNumber =
    (eventData?.accountNumber as string | undefined) ?? (eventData?.destinationAccountNumber as string | undefined)
  if (!txnRef || !accountNumber) return { processed: false }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.providerTransaction.findUnique({
      where: { monnify_transaction_reference: txnRef },
    })
    if (existing) return { processed: existing.processed, duplicate: true }

    const va = await tx.providerVirtualAccount.findFirst({
      where: { account_number: accountNumber },
    })
    if (!va) {
      await tx.providerTransaction.create({
        data: {
          monnify_transaction_reference: txnRef,
          type: "MONNIFY_COLLECTION",
          status: "UNRESOLVED",
          processed: false,
          payload: eventData as any,
        },
      })
      return { processed: false }
    }

    const amountKobo = toKobo(eventData?.amountPaid ?? eventData?.amount ?? 0)
    if (amountKobo <= 0n) throw new AppError("Invalid amount in webhook", 400)

    const ledgerId = await creditAvailable(tx, va.financial_account_id, amountKobo, {
      reference: `MONNIFY_${txnRef}`,
      source: "MONNIFY_FUNDING",
      providerReference: txnRef,
      metadata: { account_number: accountNumber, bank_name: eventData?.bankName },
    })

    await tx.providerTransaction.create({
      data: {
        monnify_transaction_reference: txnRef,
        financial_account_id: va.financial_account_id,
        provider_virtual_account_id: va.id,
        financial_transaction_id: ledgerId,
        type: "MONNIFY_COLLECTION",
        status: "SUCCESS",
        processed: true,
        processed_at: new Date(),
        amount_kobo: amountKobo,
        payload: eventData as any,
      },
    })

    return { processed: true }
  })
}

async function processMonnifyCollectionReversal(eventData: Record<string, any>) {
  const txnRef = eventData?.transactionReference as string | undefined
  if (!txnRef) return { processed: false }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.providerTransaction.findFirst({
      where: { monnify_transaction_reference: txnRef, processed: true },
    })
    if (!existing) return { processed: false }
    if (existing.amount_kobo == null) return { processed: false }
    if (!existing.financial_account_id) return { processed: false }

    const revReference = `MONNIFY_REV_${txnRef}`
    const already = await tx.financialTransaction.findUnique({ where: { reference: revReference } })
    if (already) return { processed: true, duplicate: true }

    await reverseFunding(tx, existing.financial_account_id, existing.amount_kobo, revReference, txnRef)
    return { processed: true, reversed: true }
  })
}

async function processMonnifyPayout(eventType: string, eventData: Record<string, any>) {
  const providerRef = (eventData?.paymentReference as string | undefined) ?? (eventData?.reference as string | undefined)
  if (!providerRef) return { processed: false }

  const success = eventType === "DISBURSEMENT_SUCCESSFUL"
  const confirmed = await confirmWithdrawalOutcome(providerRef, success, {
    providerTransactionReference: (eventData?.transactionReference as string | undefined) ?? providerRef,
    failureReason: success ? undefined : (eventData?.message ?? eventData?.statusMessage ?? "Payout failed"),
  })
  return { processed: true, confirmed }
}
