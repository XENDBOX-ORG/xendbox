# Xendbox Financial Migration Report

**Date:** 2026-08-14
**Provider:** Monnify (single financial rail)
**Ledger:** Xendbox internal ledger in integer kobo (NGN)

---

## 1. Previous Architecture

- Money was represented as a Naira `Float` on `financial_accounts.balance`.
- Funding: Paystack card/webhook credited the float directly via `financialAccount.upsert(balance += amount)`.
- Order payment: `payOrderFromWallet` performed a raw `balance >= price` decrement on the float.
- Riders: `recordRiderEarning` wrote an informational `rider_earning_records` row at `DELIVERED` (`price * 0.8`); no real money movement, no reservations, no withdrawals.
- No provider abstraction: `paystack.ts` was imported directly by payment code.
- Audit findings addressed here:
  - TOCTOU double-credit on rider earnings (plain create, no guard).
  - Unrestricted `updateOrderStatus` (consumer could set any status; settlement was best-effort).
  - Wallet debit/reservation race (guarded update + read pattern without a ledger).
  - No idempotency keys on external webhooks.

## 2. Target Architecture (Approved)

- Monnify is the only external financial provider. Xendbox's internal ledger is the source of truth.
- Each financial account has `available_balance` (spendable) and `reserved_balance` (held), integer kobo `BigInt`.
- Actor model (`modules/financial/actor.ts`):
  - **Merchant** — account + Monnify VA, top-up/spend only, **no withdrawal**.
  - **Independent rider** — account + VA, earns on delivery, withdraws.
  - **Logistics company** — account + VA where required, earns, withdraws.
  - **Company rider** — view-only earnings, **no account / no VA / no withdrawal**.
  - **Pickup station** — account + VA, earns, withdraws.
- Flow: merchant top-up (VA) -> order reservation (available -> reserved) -> delivery settlement consumes reservation, credits 80% rider/company + 20% platform -> withdrawals hold (available -> reserved), payout, consume/reverse hold.
- Monnify stays behind `lib/provider.ts` (FinancialProvider); the domain never imports `monnify.ts` directly.

## 3. Database Changes

- Migration: `prisma/migrations/20260814120000_financial_ledger_monnify/migration.sql` (hand-written; see §9).
- `financial_accounts`: added `available_balance` and `reserved_balance` (BigInt, default 0). Legacy `balance` Float retained and backfilled (`available_balance = ROUND(balance * 100)`), kept in sync by `syncLegacyBalance`.
- New tables:
  - `reservations` — one ACTIVE reservation per order (`order_id` unique).
  - `financial_transactions` — append-only ledger; unique `reference`; balance snapshots per row.
  - `provider_virtual_accounts` — one Monnify VA per financial account.
  - `provider_transactions` — provider event log; unique `monnify_transaction_reference`; idempotency layer.
  - `withdrawals` — request state machine with provider references.
- Enums: `FinancialTransactionType/Direction/Status`, `ReservationStatus`, `WithdrawalStatus`, `VirtualAccountStatus`.

## 4. Actor Capabilities

| Actor | Financial account | Virtual account | Can withdraw |
| --- | --- | --- | --- |
| Merchant | USER/ORGANIZATION | Yes | No |
| Independent rider | USER | Yes | Yes |
| Company rider | None | No | No |
| Logistics company | ORGANIZATION | Yes (where required) | Yes |
| Pickup station | ORGANIZATION | Yes | Yes |
| Individual consumer | USER | No | No |

## 5. Money Movement Flows

1. **Funding (top-up)**: Monnify VA credit webhook (`SUCCESSFUL_TRANSACTION`) is signature-verified, then idempotently credited via a ledger `FUNDING` transaction (`creditAvailable`), linked to `provider_transactions` by the unique Monnify transaction reference. `TRANSACTION_REVERSED` performs a guarded `reverseFunding` (REFUND). Paystack wallet funding still works through the same ledger path (`FUND_<ref>`).
2. **Order reservation**: `payOrderFromWallet` calls `reserveForOrder` inside a transaction — guarded `available >= price` move to `reserved`, creates a `Reservation` row and a `RESERVATION` ledger entry. Double reservation is rejected (409).
3. **Delivery settlement**: on `updateOrderStatus -> DELIVERED`, `settleDelivery` consumes the reservation (guarded claim), credits the rider (independent: USER account) or logistics company (ORGANIZATION account) with 80% and the PLATFORM account (`PLATFORM`/`XENDBOX`) with 20%. Idempotent via unique `SETTLE_<orderId>` reference + reservation ACTIVE claim. Writes the informational `RiderEarningRecord` for both rider types.
4. **Cancellation**: `CANCELLED`/`FAILED`/`RETURNED` call `releaseReservationForOrder` (idempotent, `RELEASE_<reservation.id>`).
5. **Withdrawal**: `requestWithdrawal` validates actor eligibility, creates the withdrawal and holds the funds (`WITHDRAWAL` ledger, available -> reserved). `initiateWithdrawalPayout` claims `REQUESTED -> PROCESSING`, then calls Monnify disbursement outside the DB transaction (idempotency key = unique `provider_reference`). Success consumes the hold; failure reverses it (`WITHDRAWAL_REVERSAL`). Monnify `DISBURSEMENT_*` webhooks finalise the outcome idempotently.

## 6. Monnify Integration

- `lib/monnify.ts` implements `lib/provider.ts`:
  - Basic-auth token (`/api/v1/auth/login`, cached).
  - Reserved account creation (`/api/v2/bank-transfer/reserved-accounts`).
  - Transaction verification (`/api/v2/transactions/search`).
  - Name enquiry (`/api/v2/disbursements/name-enquiry`).
  - Single disbursement payout (`/api/v2/disbursements/single`, amount in kobo as string).
  - HMAC-SHA512 webhook verification.
- Endpoints: `GET /api/financial/virtual-account`, `GET /api/financial/organizations/:orgId/virtual-account`, `POST /api/payments/monnify/webhook`, `POST /api/withdrawals`.
- Env: `MONNIFY_API_URL`, `MONNIFY_API_KEY`, `MONNIFY_SECRET_KEY`, `MONNIFY_CONTRACT_CODE`, `MONNIFY_WALLET_ACCOUNT_NUMBER` (added to `.env.example` files).

## 7. Security Fixes

- Double-credit / double-settlement prevented by unique ledger references and guarded state claims.
- Webhook authenticity enforced via signature (Paystack + Monnify).
- Withdrawal name-enquiry mismatch aborts the request.
- Withdrawal eligibility enforced per actor (merchants/company riders rejected).
- Wallet funding IDOR checks retained; ledger writes are atomic within `$transaction`.
- Monnify webhook collection is idempotent even on concurrent delivery (unique `monnify_transaction_reference` + unique ledger `MONNIFY_<ref>`).

## 8. Testing

- `npx tsc --noEmit -p apps/api/tsconfig.json` — passes.
- `vitest run` — 56/56 pass (13 files), including rewritten `payment.service.test.ts` and `payment.verify.test.ts` for the reservation/ledger flows.
- `prisma validate` / `prisma generate` — pass.

## 9. Remaining Issues & Notes

- **No live database**: `prisma migrate dev` cannot run locally (no DB credentials). The migration SQL is hand-written and must be applied with `prisma migrate deploy` in an environment with a Postgres database.
- **Paystack leftover**: `paystack.ts` and the Paystack order-payment / wallet-funding-init paths still exist for backward compatibility. The audit flags this as provider coupling; a future step should route order payment through the ledger only.
- **Reservation timing deviation**: reservations are created at wallet-payment time, not at order creation. Paystack-paid orders have no reservation, so settlement is skipped for them (`no_active_reservation`). Strict ERD compliance (reserve at order creation) is a follow-up.
- **Pickup-station commission** (`SettlementItemType.STATION_COMMISSION`) is not implemented; the product rule (e.g. ₦500 station share) awaits a product decision. Current split: 80% rider/company, 20% platform.
- **`settlement.service.ts` duplication**: the legacy report-style settlement module still exists and does not move money; reconcile or remove it in a follow-up to avoid confusion.
- **Monnify not configured in dev**: VA provisioning / name enquiry / payouts throw a clear `ProviderError` until `MONNIFY_*` env vars are set.
