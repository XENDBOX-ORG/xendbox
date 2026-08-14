import crypto from "node:crypto"
import { prisma } from "@xendbox/database"
import { AppError } from "../../shared/errors"
import { toKobo } from "../../lib/money"
import { monnify } from "../../lib/monnify"
import { getWithdrawableAccountForUser } from "../financial/actor"
import {
  holdForWithdrawal,
  reverseWithdrawalHold,
  consumeWithdrawalHold,
} from "../financial/financial.service"

export interface WithdrawalRequestInput {
  amount: number
  bankCode: string
  accountNumber: string
  accountName: string
  narration?: string
}

export async function requestWithdrawal(userId: string, input: WithdrawalRequestInput) {
  const holder = await getWithdrawableAccountForUser(userId)
  if (!holder) throw new AppError("Your account is not eligible for withdrawals", 403)

  const amountKobo = toKobo(input.amount)
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)

  const providerReference = `WDR_${userId.slice(0, 8)}_${Date.now()}_${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`

  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.create({
      data: {
        account_id: holder.accountId,
        amount_kobo: amountKobo,
        provider_reference: providerReference,
        destination_bank_code: input.bankCode,
        destination_account_number: input.accountNumber,
        destination_account_name: input.accountName,
        narration: input.narration,
        requested_by: userId,
        status: "REQUESTED",
      },
    })

    await holdForWithdrawal(tx, holder.accountId, amountKobo, withdrawal.id, `WITHDRAW_${withdrawal.id}`)

    return withdrawal
  })
}

/**
 * Push a requested withdrawal to the provider. The external call happens
 * OUTSIDE the DB transaction; the claim (REQUESTED -> PROCESSING) is guarded.
 */
export async function initiateWithdrawalPayout(withdrawalId: string) {
  const claimed = await prisma.$transaction(async (tx) => {
    const claim = await tx.withdrawal.updateMany({
      where: { id: withdrawalId, status: "REQUESTED" },
      data: { status: "PROCESSING" },
    })
    if (claim.count === 0) return null
    return tx.withdrawal.findUnique({ where: { id: withdrawalId } })
  })
  if (!claimed || !claimed.provider_reference) return { initiated: false }

  try {
    const result = await monnify.initiatePayout({
      transactionReference: claimed.provider_reference,
      amountKobo: claimed.amount_kobo,
      destinationBankCode: claimed.destination_bank_code,
      destinationAccountNumber: claimed.destination_account_number,
      narration: claimed.narration ?? "Xendbox payout",
    })

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          provider_transaction_reference: result.transactionReference,
          status: result.status === "SUCCESSFUL" ? "SUCCESSFUL" : "PROCESSING",
        },
      })
      if (result.status === "SUCCESSFUL") {
        await consumeWithdrawalHold(tx, claimed.account_id, claimed.amount_kobo, withdrawalId)
      }
    })

    return { initiated: true, transactionReference: result.transactionReference, status: result.status }
  } catch (err) {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "FAILED", failure_reason: err instanceof Error ? err.message : String(err) },
      })
      await reverseWithdrawalHold(
        tx,
        claimed.account_id,
        claimed.amount_kobo,
        withdrawalId,
        `WITHDRAW_REV_${withdrawalId}`
      )
    })
    return { initiated: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Finalise a withdrawal from a Monnify disbursement webhook. Idempotent:
 * only processes when the withdrawal is still PROCESSING.
 */
export async function confirmWithdrawalOutcome(
  providerReference: string,
  success: boolean,
  options: { providerTransactionReference?: string; failureReason?: string } = {}
) {
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({
      where: { provider_reference: providerReference },
    })
    if (!withdrawal) return { confirmed: false }

    if (withdrawal.status === "SUCCESSFUL" || withdrawal.status === "FAILED") {
      return { confirmed: true, duplicate: true }
    }
    if (withdrawal.status !== "PROCESSING") return { confirmed: false }

    if (success) {
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "SUCCESSFUL",
          provider_transaction_reference:
            options.providerTransactionReference ?? withdrawal.provider_transaction_reference,
          processed_at: new Date(),
        },
      })
      await consumeWithdrawalHold(tx, withdrawal.account_id, withdrawal.amount_kobo, withdrawal.id)
    } else {
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "FAILED", failure_reason: options.failureReason ?? "Payout failed", processed_at: new Date() },
      })
      await reverseWithdrawalHold(
        tx,
        withdrawal.account_id,
        withdrawal.amount_kobo,
        withdrawal.id,
        `WITHDRAW_REV_${withdrawal.id}`
      )
    }

    return { confirmed: true }
  })
}

export async function listWithdrawalsForUser(userId: string) {
  const holder = await getWithdrawableAccountForUser(userId)
  if (!holder) return []
  return prisma.withdrawal.findMany({
    where: { account_id: holder.accountId },
    orderBy: { created_at: "desc" },
  })
}

export async function getWithdrawalForUser(userId: string, withdrawalId: string) {
  const holder = await getWithdrawableAccountForUser(userId)
  if (!holder) throw new AppError("Your account is not eligible for withdrawals", 403)
  const withdrawal = await prisma.withdrawal.findFirst({
    where: { id: withdrawalId, account_id: holder.accountId },
  })
  if (!withdrawal) throw new AppError("Withdrawal not found", 404)
  return withdrawal
}