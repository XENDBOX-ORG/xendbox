-- Financial ledger migration: ledger, reservations, virtual accounts, withdrawals, provider transactions
-- (Monnify is the approved external financial provider; the Xendbox ledger remains the source of truth.)

-- CreateEnum
CREATE TYPE "FinancialTransactionType" AS ENUM ('FUNDING', 'RESERVATION', 'RESERVATION_RELEASE', 'RESERVATION_CONSUME', 'SETTLEMENT', 'FEE', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FinancialTransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "FinancialTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "VirtualAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED');

-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "available_balance" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "reserved_balance" BIGINT NOT NULL DEFAULT 0;

-- Backfill existing Float balances into kobo (smallest monetary unit).
UPDATE "financial_accounts" SET "available_balance" = ROUND(CAST("balance" AS numeric) * 100);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount_kobo" BIGINT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "amount_kobo" BIGINT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "provider_reference" TEXT,
    "provider_transaction_reference" TEXT,
    "destination_bank_code" TEXT NOT NULL,
    "destination_account_number" TEXT NOT NULL,
    "destination_account_name" TEXT NOT NULL,
    "destination_bank_name" TEXT,
    "narration" TEXT,
    "failure_reason" TEXT,
    "requested_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_virtual_accounts" (
    "id" TEXT NOT NULL,
    "financial_account_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MONNIFY',
    "account_reference" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "bank_name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "provider_customer_email" TEXT,
    "status" "VirtualAccountStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_virtual_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "FinancialTransactionType" NOT NULL,
    "direction" "FinancialTransactionDirection" NOT NULL,
    "amount_kobo" BIGINT NOT NULL,
    "available_balance_after" BIGINT NOT NULL,
    "reserved_balance_after" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "FinancialTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "reference" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "order_id" TEXT,
    "reservation_id" TEXT,
    "withdrawal_id" TEXT,
    "provider_reference" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_transactions" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MONNIFY',
    "monnify_transaction_reference" TEXT NOT NULL,
    "payment_reference" TEXT,
    "amount_kobo" BIGINT,
    "currency" TEXT,
    "transaction_status" TEXT,
    "settlement_status" TEXT,
    "payment_method" TEXT,
    "account_number" TEXT,
    "bank_name" TEXT,
    "financial_account_id" TEXT,
    "provider_virtual_account_id" TEXT,
    "financial_transaction_id" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_order_id_key" ON "reservations"("order_id");
CREATE INDEX "reservations_account_id_idx" ON "reservations"("account_id");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_provider_reference_key" ON "withdrawals"("provider_reference");
CREATE UNIQUE INDEX "withdrawals_provider_transaction_reference_key" ON "withdrawals"("provider_transaction_reference");
CREATE INDEX "withdrawals_account_id_idx" ON "withdrawals"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_virtual_accounts_financial_account_id_key" ON "provider_virtual_accounts"("financial_account_id");
CREATE UNIQUE INDEX "provider_virtual_accounts_account_reference_key" ON "provider_virtual_accounts"("account_reference");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_reference_key" ON "financial_transactions"("reference");
CREATE INDEX "financial_transactions_account_id_created_at_idx" ON "financial_transactions"("account_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_transactions_monnify_transaction_reference_key" ON "provider_transactions"("monnify_transaction_reference");
CREATE UNIQUE INDEX "provider_transactions_financial_transaction_id_key" ON "provider_transactions"("financial_transaction_id");
CREATE INDEX "provider_transactions_financial_account_id_idx" ON "provider_transactions"("financial_account_id");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_virtual_accounts" ADD CONSTRAINT "provider_virtual_accounts_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_transactions" ADD CONSTRAINT "provider_transactions_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_transactions" ADD CONSTRAINT "provider_transactions_provider_virtual_account_id_fkey" FOREIGN KEY ("provider_virtual_account_id") REFERENCES "provider_virtual_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_transactions" ADD CONSTRAINT "provider_transactions_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;