import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  paymentFindFirst: vi.fn(),
  paymentUpdateMany: vi.fn(),
  paymentUpdate: vi.fn(),
  accountUpsert: vi.fn(),
  accountUpdate: vi.fn(),
  accountFindUnique: vi.fn(),
  transactionCreate: vi.fn(),
  transaction: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    payment: {
      findFirst: (...a: unknown[]) => mocks.paymentFindFirst(...a),
      updateMany: (...a: unknown[]) => mocks.paymentUpdateMany(...a),
      update: (...a: unknown[]) => mocks.paymentUpdate(...a),
    },
  },
}))

vi.mock("../../lib/paystack", () => ({
  verifyTransaction: vi.fn(async (ref: string) => {
    if (ref === "ref-success") return { status: true, data: { status: "success" } }
    return { status: true, data: { status: "failed" } }
  }),
}))

import { verifyWalletFunding } from "./payment.service"
import { prisma } from "@xendbox/database"

const account = {
  id: "acc-1",
  available_balance: 50000n,
  reserved_balance: 0n,
  balance: 500,
}

const txMock = {
  financialAccount: {
    upsert: (...a: unknown[]) => mocks.accountUpsert(...a),
    update: (...a: unknown[]) => mocks.accountUpdate(...a),
    findUnique: (...a: unknown[]) => mocks.accountFindUnique(...a),
  },
  financialTransaction: {
    create: (...a: unknown[]) => mocks.transactionCreate(...a),
  },
  payment: {
    update: (...a: unknown[]) => mocks.paymentUpdate(...a),
  },
}

mocks.transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) =>
  fn(txMock)
)

prisma.$transaction = mocks.transaction as never

beforeEach(() => {
  vi.clearAllMocks()
})

describe("verifyWalletFunding", () => {
  it("throws when the payment belongs to another user (IDOR)", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "pay-1",
      status: "PENDING",
      metadata: { type: "wallet_funding", user_id: "other-user" },
    })

    await expect(verifyWalletFunding("ref-1", "me-user")).rejects.toMatchObject({
      message: "Payment does not belong to this user",
    })
    expect(mocks.accountUpsert).not.toHaveBeenCalled()
  })

  it("rejects re-verification of an already-claimed payment (double credit guard)", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "pay-1",
      status: "PENDING",
      metadata: { type: "wallet_funding", user_id: "me-user" },
    })
    mocks.paymentUpdateMany.mockResolvedValue({ count: 0 })

    await expect(verifyWalletFunding("ref-1", "me-user")).rejects.toMatchObject({
      message: "Payment already verified",
    })
    expect(mocks.accountUpsert).not.toHaveBeenCalled()
  })

  it("credits the wallet exactly once on success", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "pay-1",
      status: "PENDING",
      amount: 500,
      metadata: { type: "wallet_funding", user_id: "me-user" },
    })
    mocks.paymentUpdateMany.mockResolvedValue({ count: 1 })
    mocks.paymentUpdate.mockResolvedValue({ id: "pay-1" })
    mocks.accountUpsert.mockResolvedValue(account)
    mocks.accountUpdate.mockResolvedValue(account)
    mocks.accountFindUnique.mockResolvedValue(account)
    mocks.transactionCreate.mockResolvedValue({ id: "lt-1" })

    const result = await verifyWalletFunding("ref-success", "me-user")

    expect(result.message).toBe("Wallet funded successfully")
    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "PROCESSING" },
      })
    )
    const creditArgs = mocks.accountUpdate.mock.calls[0][0]
    expect(creditArgs.data.available_balance.increment).toBe(50000n)
    const ledgerCall = mocks.transactionCreate.mock.calls[0][0]
    expect(ledgerCall.data).toEqual(
      expect.objectContaining({
        type: "FUNDING",
        direction: "CREDIT",
        reference: "FUND_ref-success",
        amount_kobo: 50000n,
      })
    )
    expect(mocks.paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUCCESS" }) })
    )
  })

  it("marks the payment FAILED when verification fails", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "pay-1",
      status: "PENDING",
      metadata: { type: "wallet_funding", user_id: "me-user" },
    })
    mocks.paymentUpdateMany.mockResolvedValue({ count: 1 })

    await expect(verifyWalletFunding("ref-bad", "me-user")).rejects.toBeInstanceOf(AppError)
    const updateCall = mocks.paymentUpdate.mock.calls.find(
      (c) => c[0]?.data?.status === "FAILED"
    )
    expect(updateCall).toBeTruthy()
  })
})