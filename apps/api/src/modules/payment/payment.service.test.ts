import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  paymentFindFirst: vi.fn(),
  paymentUpdateMany: vi.fn(),
  paymentUpdate: vi.fn(),
  paymentCreate: vi.fn(),
  orderFindFirst: vi.fn(),
  orderUpdate: vi.fn(),
}

let txImpl: ((fn: (t: any) => unknown) => unknown) | null = null

vi.mock("@xendbox/database", () => ({
  prisma: {
    payment: {
      findFirst: (...a: unknown[]) => mocks.paymentFindFirst(...a),
      updateMany: (...a: unknown[]) => mocks.paymentUpdateMany(...a),
      update: (...a: unknown[]) => mocks.paymentUpdate(...a),
      create: (...a: unknown[]) => mocks.paymentCreate(...a),
    },
    order: {
      findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a),
      update: (...a: unknown[]) => mocks.orderUpdate(...a),
    },
    $transaction: vi.fn((fn: (t: any) => unknown) => fn({
      payment: {
        findFirst: (...a: unknown[]) => mocks.paymentFindFirst(...a),
        updateMany: (...a: unknown[]) => mocks.paymentUpdateMany(...a),
        update: (...a: unknown[]) => mocks.paymentUpdate(...a),
        create: (...a: unknown[]) => mocks.paymentCreate(...a),
      },
      order: {
        findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a),
        update: (...a: unknown[]) => mocks.orderUpdate(...a),
      },
      financialAccount: {
        upsert: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      reservation: { findUnique: vi.fn() },
      financialTransaction: { findUnique: vi.fn() },
      providerTransaction: { findUnique: vi.fn() },
      providerVirtualAccount: { findFirst: vi.fn() },
      riderEarningRecord: { create: vi.fn() },
      user: { findUnique: vi.fn() },
      organization: { findUnique: vi.fn() },
    })),
  },
}))

vi.mock("../../lib/paystack", () => ({
  initializeTransaction: vi.fn().mockResolvedValue({ status: true, data: { authorization_url: "https://url", reference: "ref", access_code: "code" } }),
  verifyTransaction: vi.fn().mockResolvedValue({ status: true, data: { status: "success" } }),
}))

vi.mock("../../lib/money", () => ({
  toKobo: vi.fn((n: number) => BigInt(Math.round(n * 100))),
}))

vi.mock("../../jobs", () => ({
  cancelOrderExpiry: vi.fn(),
}))

vi.mock("../financial/financial.service", () => ({
  getOrCreateAccountForOwner: vi.fn().mockResolvedValue({ id: "account-1" }),
  reserveForOrder: vi.fn(),
  creditAvailable: vi.fn().mockResolvedValue("ledger-1"),
  reverseFunding: vi.fn(),
}))

vi.mock("../withdrawal/withdrawal.service", () => ({
  confirmWithdrawalOutcome: vi.fn().mockResolvedValue({ confirmed: true }),
}))

import { initializeWalletFunding, verifyWalletFunding, initializeOrderPayment, verifyOrderPayment, payOrderFromWallet, handlePaystackWebhook } from "./payment.service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("initializeWalletFunding", () => {
  it("throws when amount is not positive", async () => {
    await expect(initializeWalletFunding("user-1", "email@example.com", 0)).rejects.toMatchObject({ message: "Amount must be positive", status: 400 })
  })
})

describe("verifyWalletFunding", () => {
  it("throws when payment not found", async () => {
    mocks.paymentFindFirst.mockResolvedValue(null)
    await expect(verifyWalletFunding("ref-1", "user-1")).rejects.toMatchObject({ message: "Payment not found", status: 404 })
  })
})

describe("initializeOrderPayment", () => {
  it("throws when order not found", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(initializeOrderPayment("user-1", "email@example.com", "order-1", "consumer-1")).rejects.toMatchObject({ message: "Order not found", status: 404 })
  })
})

describe("verifyOrderPayment", () => {
  it("throws when payment not found", async () => {
    mocks.paymentFindFirst.mockResolvedValue(null)
    await expect(verifyOrderPayment("ref-1")).rejects.toMatchObject({ message: "Payment not found", status: 404 })
  })
})

describe("payOrderFromWallet", () => {
  it("throws when order not found", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(payOrderFromWallet("order-1", "consumer-1", "user-1")).rejects.toMatchObject({ message: "Order not found", status: 404 })
  })
})

describe("handlePaystackWebhook", () => {
  it("returns for non-charge-success events", async () => {
    const result = await handlePaystackWebhook("charge.failed", {})
    expect(result).toBeUndefined()
  })
})
