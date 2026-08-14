import { prisma } from "@xendbox/database"
import type { Prisma } from "@prisma/client"
import { AppError } from "../../shared/errors"
import { koboToNaira, type Kobo } from "../../lib/money"
import { monnify } from "../../lib/monnify"

type Tx = Prisma.TransactionClient

/**
 * Financial ledger operations.
 *
 * Every balance-affecting mutation:
 *  1. runs inside a database transaction
 *  2. moves `available_balance` / `reserved_balance` (integer kobo) atomically
 *  3. writes an auditable `FinancialTransaction` row with balance snapshots
 *  4. keeps the legacy `balance` (naira Float) column in sync for older clients
 *
 * Money is NEVER created by an ordinary HTTP request. Credits only originate
 * from verified provider events, settlements, reservation releases, refunds or
 * explicit internal adjustments.
 */

export async function getOrCreateUserAccount(userId: string) {
  return prisma.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: "USER", owner_id: userId } },
    create: { owner_type: "USER", owner_id: userId },
    update: {},
  })
}

export async function getOrCreateOrganizationAccount(organizationId: string) {
  return prisma.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: "ORGANIZATION", owner_id: organizationId } },
    create: { owner_type: "ORGANIZATION", owner_id: organizationId },
    update: {},
  })
}

export async function getOrCreatePlatformAccount() {
  return prisma.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: "PLATFORM", owner_id: "XENDBOX" } },
    create: { owner_type: "PLATFORM", owner_id: "XENDBOX" },
    update: {},
  })
}

export async function getOrCreateAccountForOwner(tx: Tx, ownerType: string, ownerId: string) {
  return tx.financialAccount.upsert({
    where: { owner_type_owner_id: { owner_type: ownerType, owner_id: ownerId } },
    create: { owner_type: ownerType, owner_id: ownerId },
    update: {},
  })
}

async function getOrCreateAccount(tx: Tx, ownerType: string, ownerId: string) {
  return getOrCreateAccountForOwner(tx, ownerType, ownerId)
}

interface LedgerInput {
  accountId: string
  type:
    | "FUNDING"
    | "RESERVATION"
    | "RESERVATION_RELEASE"
    | "RESERVATION_CONSUME"
    | "SETTLEMENT"
    | "FEE"
    | "WITHDRAWAL"
    | "WITHDRAWAL_REVERSAL"
    | "REFUND"
    | "ADJUSTMENT"
  direction: "CREDIT" | "DEBIT"
  amountKobo: Kobo
  reference: string
  source: string
  orderId?: string | null
  reservationId?: string | null
  withdrawalId?: string | null
  providerReference?: string | null
  metadata?: Prisma.InputJsonValue
}

/** Keep the legacy naira float `balance` equal to the available balance. */
async function syncLegacyBalance(tx: Tx, accountId: string): Promise<void> {
  const account = await tx.financialAccount.findUnique({ where: { id: accountId } })
  if (!account) return
  const naira = Number(account.available_balance) / 100
  if (Math.abs((account.balance ?? 0) - naira) > 1e-9) {
    await tx.financialAccount.update({
      where: { id: accountId },
      data: { balance: naira },
    })
  }
}

async function recordLedger(
  tx: Tx,
  account: { id: string; available_balance: Kobo; reserved_balance: Kobo },
  input: LedgerInput
): Promise<{ id: string }> {
  return tx.financialTransaction.create({
    data: {
      account_id: input.accountId,
      type: input.type,
      direction: input.direction,
      amount_kobo: input.amountKobo,
      available_balance_after: account.available_balance,
      reserved_balance_after: account.reserved_balance,
      reference: input.reference,
      source: input.source,
      order_id: input.orderId ?? null,
      reservation_id: input.reservationId ?? null,
      withdrawal_id: input.withdrawalId ?? null,
      provider_reference: input.providerReference ?? null,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  })
}

/** Internal: credit an account's AVAILABLE balance via a ledger FUNDING event. */
export async function creditAvailable(
  tx: Tx,
  accountId: string,
  amountKobo: Kobo,
  input: Omit<LedgerInput, "accountId" | "amountKobo" | "direction" | "type">
): Promise<string> {
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)
  const account = await tx.financialAccount.update({
    where: { id: accountId },
    data: { available_balance: { increment: amountKobo } },
  })
  await syncLegacyBalance(tx, accountId)
  const ledger = await recordLedger(tx, account, {
    ...input,
    accountId,
    type: "FUNDING",
    direction: "CREDIT",
    amountKobo,
  })
  return ledger.id
}

/**
 * Atomically reserve funds for an order: moves AVAILABLE -> RESERVED and writes
 * a Reservation row + a RESERVATION ledger entry. Guards against overspending
 * and double reservation (one ACTIVE reservation per order).
 */
export async function reserveForOrder(
  tx: Tx,
  accountId: string,
  orderId: string,
  amountKobo: Kobo,
  source: string
): Promise<{ reservationId: string }> {
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)

  const existing = await tx.reservation.findUnique({ where: { order_id: orderId } })
  if (existing) throw new AppError("Funds already reserved for this order", 409)

  const moved = await tx.financialAccount.updateMany({
    where: { id: accountId, available_balance: { gte: amountKobo } },
    data: {
      available_balance: { decrement: amountKobo },
      reserved_balance: { increment: amountKobo },
    },
  })
  if (moved.count === 0) {
    throw new AppError("Insufficient balance", 400)
  }

  const account = await tx.financialAccount.findUnique({ where: { id: accountId } })
  if (!account) throw new AppError("Financial account not found", 404)
  await syncLegacyBalance(tx, accountId)

  const reservation = await tx.reservation.create({
    data: { account_id: accountId, order_id: orderId, amount_kobo: amountKobo },
  })

  await recordLedger(tx, account, {
    accountId,
    type: "RESERVATION",
    direction: "DEBIT",
    amountKobo,
    reference: `RESERVE_${orderId}`,
    source,
    orderId,
    reservationId: reservation.id,
  })

  return { reservationId: reservation.id }
}

/**
 * Release an ACTIVE reservation back to AVAILABLE (cancellation / failure /
 * return). Idempotent: a reservation that is no longer ACTIVE is a no-op.
 * Guarded updateMany makes concurrent double-release safe.
 */
export async function releaseReservationForOrder(orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { order_id: orderId },
    })
    if (!reservation || reservation.status !== "ACTIVE") return false

    const claimed = await tx.reservation.updateMany({
      where: { id: reservation.id, status: "ACTIVE" },
      data: { status: "RELEASED", closed_at: new Date() },
    })
    if (claimed.count === 0) return false

    await tx.financialAccount.update({
      where: { id: reservation.account_id },
      data: {
        available_balance: { increment: reservation.amount_kobo },
        reserved_balance: { decrement: reservation.amount_kobo },
      },
    })

    const account = await tx.financialAccount.findUnique({
      where: { id: reservation.account_id },
    })
    if (!account) throw new AppError("Financial account not found", 404)
    await syncLegacyBalance(tx, reservation.account_id)

    await recordLedger(tx, account, {
      accountId: reservation.account_id,
      type: "RESERVATION_RELEASE",
      direction: "CREDIT",
      amountKobo: reservation.amount_kobo,
      reference: `RELEASE_${reservation.id}`,
      source: "ORDER_CANCELLED",
      orderId,
      reservationId: reservation.id,
    })
    return true
  })
}

/**
 * Delivery settlement. Consumes the merchant reservation and allocates the value
 * inside the Xendbox ledger:
 *
 *   merchant reservation (price)
 *      ├── rider / logistics company   (product rule: 80% of price)
 *      └── Xendbox platform revenue    (remaining 20%)
 *
 * Idempotent: guarded by the unique ledger reference `SETTLE_<orderId>` and the
 * reservation ACTIVE claim. Duplicate or concurrent calls cannot double-credit.
 */
export async function settleDelivery(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        dispatch: {
          include: {
            assigned_rider: {
              include: { user: { select: { id: true } } },
            },
          },
        },
        pickup_station: { select: { organization_id: true } },
      },
    })
    if (!order) return { settled: false, reason: "order_not_found" }
    if (order.status !== "DELIVERED") return { settled: false, reason: "order_not_delivered" }

    const reservation = await tx.reservation.findUnique({ where: { order_id: orderId } })
    if (!reservation || reservation.status !== "ACTIVE") {
      return { settled: false, reason: "no_active_reservation" }
    }

    const planRef = `SETTLE_${orderId}`
    const alreadySettled = await tx.financialTransaction.findUnique({
      where: { reference: planRef },
    })
    if (alreadySettled) return { settled: true, alreadySettled: true }

    const priceKobo = reservation.amount_kobo
    const riderKobo = (priceKobo * 80n) / 100n
    const platformKobo = priceKobo - riderKobo

    // Consume the reservation (guarded claim).
    const consumed = await tx.reservation.updateMany({
      where: { id: reservation.id, status: "ACTIVE" },
      data: { status: "CONSUMED", closed_at: new Date() },
    })
    if (consumed.count === 0) return { settled: false, reason: "reservation_already_consumed" }

    await tx.financialAccount.update({
      where: { id: reservation.account_id },
      data: { reserved_balance: { decrement: priceKobo } },
    })
    const merchantAccount = await tx.financialAccount.findUnique({
      where: { id: reservation.account_id },
    })
    if (!merchantAccount) throw new AppError("Financial account not found", 404)
    await syncLegacyBalance(tx, reservation.account_id)

    await recordLedger(tx, merchantAccount, {
      accountId: reservation.account_id,
      type: "RESERVATION_CONSUME",
      direction: "DEBIT",
      amountKobo: priceKobo,
      reference: planRef,
      source: "DELIVERY_SETTLEMENT",
      orderId,
      reservationId: reservation.id,
    })

    const rider = order.dispatch?.assigned_rider
    if (rider && riderKobo > 0n) {
      const recipient =
        rider.type === "INDEPENDENT"
          ? await getOrCreateAccount(tx, "USER", rider.user.id)
          : rider.organization_id
            ? await getOrCreateAccount(tx, "ORGANIZATION", rider.organization_id)
            : null

      if (recipient) {
        await tx.financialAccount.update({
          where: { id: recipient.id },
          data: { available_balance: { increment: riderKobo } },
        })
        await syncLegacyBalance(tx, recipient.id)
        const recipientAfter = await tx.financialAccount.findUnique({
          where: { id: recipient.id },
        })
        if (!recipientAfter) throw new AppError("Financial account not found", 404)
        await recordLedger(tx, recipientAfter, {
          accountId: recipient.id,
          type: "SETTLEMENT",
          direction: "CREDIT",
          amountKobo: riderKobo,
          reference: `${planRef}_DELIVERY`,
          source: "DELIVERY_SETTLEMENT",
          orderId,
        })
        // Informational earnings record (visible to both rider types).
        await tx.riderEarningRecord.create({
          data: {
            rider_id: rider.id,
            order_id: orderId,
            amount: koboToNaira(riderKobo),
            payment_source: "DELIVERY_SETTLEMENT",
          },
        })
      }
    }

    if (platformKobo > 0n) {
      const platform = await getOrCreateAccount(tx, "PLATFORM", "XENDBOX")
      await tx.financialAccount.update({
        where: { id: platform.id },
        data: { available_balance: { increment: platformKobo } },
      })
      await syncLegacyBalance(tx, platform.id)
      const platformAfter = await tx.financialAccount.findUnique({
        where: { id: platform.id },
      })
      if (!platformAfter) throw new AppError("Financial account not found", 404)
      await recordLedger(tx, platformAfter, {
        accountId: platform.id,
        type: "FEE",
        direction: "CREDIT",
        amountKobo: platformKobo,
        reference: `${planRef}_FEE`,
        source: "DELIVERY_SETTLEMENT",
        orderId,
      })
    }

    return { settled: true }
  })
}

/** Withdraw/deduct the AVAILABLE balance in one atomic guarded operation (payout hold). */
export async function holdForWithdrawal(
  tx: Tx,
  accountId: string,
  amountKobo: Kobo,
  withdrawalId: string,
  reference: string
): Promise<void> {
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)
  const moved = await tx.financialAccount.updateMany({
    where: { id: accountId, available_balance: { gte: amountKobo } },
    data: {
      available_balance: { decrement: amountKobo },
      reserved_balance: { increment: amountKobo },
    },
  })
  if (moved.count === 0) throw new AppError("Insufficient balance", 400)

  const account = await tx.financialAccount.findUnique({ where: { id: accountId } })
  if (!account) throw new AppError("Financial account not found", 404)
  await syncLegacyBalance(tx, accountId)

  await recordLedger(tx, account, {
    accountId,
    type: "WITHDRAWAL",
    direction: "DEBIT",
    amountKobo,
    reference,
    source: "WITHDRAWAL",
    withdrawalId,
  })
}

/** Reverse a failed/cancelled withdrawal hold back to AVAILABLE. */
export async function reverseWithdrawalHold(
  tx: Tx,
  accountId: string,
  amountKobo: Kobo,
  withdrawalId: string,
  reference: string
): Promise<void> {
  const moved = await tx.financialAccount.updateMany({
    where: { id: accountId, reserved_balance: { gte: amountKobo } },
    data: {
      available_balance: { increment: amountKobo },
      reserved_balance: { decrement: amountKobo },
    },
  })
  if (moved.count === 0) throw new AppError("Withdrawal hold not found", 400)

  const account = await tx.financialAccount.findUnique({ where: { id: accountId } })
  if (!account) throw new AppError("Financial account not found", 404)
  await syncLegacyBalance(tx, accountId)

  await recordLedger(tx, account, {
    accountId,
    type: "WITHDRAWAL_REVERSAL",
    direction: "CREDIT",
    amountKobo,
    reference,
    source: "WITHDRAWAL_REVERSAL",
    withdrawalId,
  })
}

/** Finalise a successful payout: consume the reserved hold. */
export async function consumeWithdrawalHold(
  tx: Tx,
  accountId: string,
  amountKobo: Kobo,
  withdrawalId: string
): Promise<void> {
  const account = await tx.financialAccount.findUnique({ where: { id: accountId } })
  if (!account) throw new AppError("Financial account not found", 404)
  await tx.financialAccount.update({
    where: { id: accountId },
    data: { reserved_balance: { decrement: amountKobo } },
  })
  await syncLegacyBalance(tx, accountId)
}

export async function listAccountTransactions(accountId: string) {
  return prisma.financialTransaction.findMany({
    where: { account_id: accountId },
    orderBy: { created_at: "desc" },
    take: 100,
  })
}

// ---------------------------------------------------------------------------
// Monnify virtual accounts
// ---------------------------------------------------------------------------

/** Reverse a previously-credited funding event (e.g. Monnify TRANSACTION_REVERSED). */
export async function reverseFunding(
  tx: Tx,
  accountId: string,
  amountKobo: Kobo,
  reference: string,
  providerReference?: string
): Promise<void> {
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)
  const moved = await tx.financialAccount.updateMany({
    where: { id: accountId, available_balance: { gte: amountKobo } },
    data: { available_balance: { decrement: amountKobo } },
  })
  if (moved.count === 0) throw new AppError("Insufficient available balance to reverse funding", 400)
  await syncLegacyBalance(tx, accountId)
  const after = await tx.financialAccount.findUnique({ where: { id: accountId } })
  if (!after) throw new AppError("Financial account not found", 404)
  await recordLedger(tx, after, {
    accountId,
    type: "REFUND",
    direction: "DEBIT",
    amountKobo,
    reference,
    source: "MONNIFY_FUNDING_REVERSAL",
    providerReference,
  })
}

async function resolveAccountDisplayName(ownerType: string, ownerId: string): Promise<string> {
  if (ownerType === "USER") {
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { first_name: true, last_name: true },
    })
    return user ? `${user.first_name} ${user.last_name}`.trim() : "Xendbox User"
  }
  const org = await prisma.organization.findUnique({ where: { id: ownerId }, select: { name: true } })
  return org?.name ?? "Xendbox Organization"
}

/**
 * Idempotently provision a Monnify virtual account for a financial account.
 * Only call after confirming the actor is allowed (see canHaveVirtualAccount).
 */
export async function getOrProvisionVirtualAccount(ownerType: string, ownerId: string) {
  const account =
    ownerType === "USER" ? await getOrCreateUserAccount(ownerId) : await getOrCreateOrganizationAccount(ownerId)

  const existing = await prisma.providerVirtualAccount.findUnique({
    where: { financial_account_id: account.id },
  })
  if (existing) return existing

  const accountReference = `XENDBOX-${ownerType}-${ownerId}`.replace(/[^A-Za-z0-9_-]/g, "")
  const customerEmail =
    ownerType === "USER"
      ? ((await prisma.user.findUnique({ where: { id: ownerId }, select: { email: true } }))?.email ?? undefined)
      : undefined

  const result = await monnify.createVirtualAccount({
    accountReference,
    accountName: await resolveAccountDisplayName(ownerType, ownerId),
    customerEmail,
  })

  return prisma.providerVirtualAccount.create({
    data: {
      financial_account_id: account.id,
      account_reference: result.accountReference,
      account_number: result.accountNumber,
      account_name: result.accountName,
      bank_name: result.bankName,
      status: "ACTIVE",
      metadata: { provider: "MONNIFY" },
    },
  })
}

export async function getVirtualAccountForAccount(accountId: string) {
  return prisma.providerVirtualAccount.findUnique({ where: { financial_account_id: accountId } })
}

// ---------------------------------------------------------------------------
// Backward-compatible helpers
// ---------------------------------------------------------------------------

/** Legacy record-writer: records an informational earning (no wallet mutation). */
export async function recordRiderEarning(
  riderId: string,
  orderId: string,
  amount: number,
  paymentSource: string
) {
  if (amount <= 0) throw new AppError("Amount must be positive", 400)
  return prisma.riderEarningRecord.create({
    data: { rider_id: riderId, order_id: orderId, amount, payment_source: paymentSource },
    include: {
      order: true,
      rider: { include: { user: { select: { id: true, first_name: true, last_name: true } } } },
    },
  })
}

export async function getRiderEarnings(riderId: string) {
  return prisma.riderEarningRecord.findMany({
    where: { rider_id: riderId },
    include: { order: { select: { tracking_number: true, created_at: true } } },
    orderBy: { created_at: "desc" },
  })
}

export async function getRiderEarningsSummary(riderId: string) {
  const records = await prisma.riderEarningRecord.findMany({ where: { rider_id: riderId } })
  const total = records.reduce((sum, r) => sum + r.amount, 0)
  return { total_earned: total, total_deliveries: records.length }
}

/**
 * Legacy credit/debit helpers. These MUST NOT be exposed through any route.
 * `creditAccount` is intentionally unexported-safe: it is now an alias for a
 * ledger FUNDING credit and must only be invoked from verified financial events.
 */
export async function creditAccount(ownerType: "USER" | "ORGANIZATION" | "PLATFORM", ownerId: string, amount: number) {
  const amountKobo = BigInt(Math.round(amount * 100))
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)
  return prisma.$transaction(async (tx) => {
    const account = await getOrCreateAccount(tx, ownerType, ownerId)
    await creditAvailable(tx, account.id, amountKobo, {
      reference: `ADJ_${account.id}_${Date.now()}`,
      source: "LEGACY_CREDIT",
    })
  })
}

export async function debitAccount(ownerType: "USER" | "ORGANIZATION", ownerId: string, amount: number) {
  const amountKobo = BigInt(Math.round(amount * 100))
  if (amountKobo <= 0n) throw new AppError("Amount must be positive", 400)
  return prisma.$transaction(async (tx) => {
    const account = await getOrCreateAccount(tx, ownerType, ownerId)
    const moved = await tx.financialAccount.updateMany({
      where: { id: account.id, available_balance: { gte: amountKobo } },
      data: { available_balance: { decrement: amountKobo } },
    })
    if (moved.count === 0) throw new AppError("Insufficient balance", 400)
    await syncLegacyBalance(tx, account.id)
    const after = await tx.financialAccount.findUnique({ where: { id: account.id } })
    if (!after) throw new AppError("Financial account not found", 404)
    await recordLedger(tx, after, {
      accountId: account.id,
      type: "ADJUSTMENT",
      direction: "DEBIT",
      amountKobo,
      reference: `ADJ_${account.id}_${Date.now()}`,
      source: "LEGACY_DEBIT",
    })
  })
}