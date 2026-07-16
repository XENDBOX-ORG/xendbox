import { prisma } from "@xendbox/database"
import crypto from "node:crypto"
import { initializeTransaction, verifyTransaction } from "../../lib/paystack"
import { getOrCreateUserAccount, creditAccount, debitAccount } from "../financial/financial.service"
import { AppError } from "../identity/auth.service"

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

export async function verifyWalletFunding(reference: string) {
  const payment = await prisma.payment.findFirst({
    where: { provider_reference: reference },
  })
  if (!payment) throw new AppError("Payment not found", 404)
  if (payment.status === "SUCCESS") throw new AppError("Payment already verified", 400)

  const result = await verifyTransaction(reference)
  if (!result.status || result.data.status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    })
    throw new AppError("Payment verification failed", 400)
  }

  const metadata = payment.metadata as { type?: string; user_id?: string } | null
  if (metadata?.type === "wallet_funding" && metadata?.user_id) {
    await creditAccount("USER", metadata.user_id, payment.amount)
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      metadata: { ...(metadata || {}), paystack_data: result.data },
    },
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
  if (payment.status === "SUCCESS") throw new AppError("Payment already verified", 400)

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

  return { message: "Order payment successful" }
}

export async function payOrderFromWallet(orderId: string, consumerId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, consumer_id: consumerId },
  })
  if (!order) throw new AppError("Order not found", 404)
  if (order.payment_status !== "PENDING") throw new AppError("Order already paid", 400)

  const account = await getOrCreateUserAccount(userId)
  if (account.balance < order.price) throw new AppError("Insufficient wallet balance", 400)

  await prisma.$transaction([
    prisma.financialAccount.update({
      where: { id: account.id },
      data: { balance: { decrement: order.price } },
    }),
    prisma.payment.create({
      data: {
        order_id: orderId,
        amount: order.price,
        provider: "WALLET",
        status: "SUCCESS",
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        payment_status: "PAID",
        events: {
          create: {
            event_type: "PAYMENT_COMPLETED",
            metadata: { provider: "WALLET" },
          },
        },
      },
    }),
  ])

  return { message: "Order paid from wallet" }
}

export async function handlePaystackWebhook(event: string, data: any) {
  if (event !== "charge.success") return

  const reference = data.reference
  const metadata = data.metadata || {}

  if (metadata.type === "wallet_funding") {
    await verifyWalletFunding(reference)
  } else if (metadata.type === "order_payment") {
    await verifyOrderPayment(reference)
  }
}
