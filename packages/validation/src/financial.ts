import { z } from "zod"
import { idSchema } from "./common"

export const amountSchema = z.number().positive().finite("Amount must be a positive number")

export const creditSchema = z.object({
  amount: amountSchema,
})

export const debitSchema = z.object({
  amount: amountSchema,
})

export const initializeWalletFundingSchema = z.object({
  amount: amountSchema,
})

export const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
})

export const initializeOrderPaymentSchema = z.object({
  order_id: idSchema,
})

export const generateSettlementSchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format")
    .optional(),
})

export const bankCodeSchema = z.string().regex(/^\d{3}$/, "Invalid bank code")

export const bankAccountNumberSchema = z.string().regex(/^\d{10}$/, "Invalid account number")

export const requestWithdrawalSchema = z.object({
  amount: amountSchema,
  bank_code: bankCodeSchema,
  account_number: bankAccountNumberSchema,
  account_name: z.string().min(2, "Account name is required"),
  narration: z.string().max(100).optional(),
})