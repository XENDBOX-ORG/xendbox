import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  orderFindFirst: vi.fn(),
  accountUpsert: vi.fn(),
  accountUpdateMany: vi.fn(),
  accountFindUnique: vi.fn(),
  accountUpdate: vi.fn(),
  reservationFindUnique: vi.fn(),
  reservationCreate: vi.fn(),
  transactionCreate: vi.fn(),
  paymentCreate: vi.fn(),
  orderUpdate: vi.fn(),
  transaction: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    order: { findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a) },
    payment: { create: (...a: unknown[]) => mocks.paymentCreate(...a) },
  },
}))

import { payOrderFromWallet } from "./payment.service"
import { prisma } from "@xendbox/database"

const txMock = {
  order: {
    findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a),
    update: (...a: unknown[]) => mocks.orderUpdate(...a),
  },
  financialAccount: {
    upsert: (...a: unknown[]) => mocks.accountUpsert(...a),
    updateMany: (...a: unknown[]) => mocks.accountUpdateMany(...a),
    findUnique: (...a: unknown[]) => mocks.accountFindUnique(...a),
    update: (...a: unknown[]) => mocks.accountUpdate(...a),
  },
  reservation: {
    findUnique: (...a: unknown[]) => mocks.reservationFindUnique(...a),
    create: (...a: unknown[]) => mocks.reservationCreate(...a),
  },
  financialTransaction: {
    create: (...a: unknown[]) => mocks.transactionCreate(...a),
  },
  payment: {
    create: (...a: unknown[]) => mocks.paymentCreate(...a),
  },
}

mocks.transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) =>
  fn(txMock)
)

prisma.$transaction = mocks.transaction as never

beforeEach(() => {
  vi.clearAllMocks()
})

describe("payOrderFromWallet", () => {
  it("throws when the order is not owned by the consumer", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(
      payOrderFromWallet("order-1", "consumer-1", "user-1")
    ).rejects.toMatchObject({ message: "Order not found" })
  })

  it("rejects a non-PENDING order", async () => {
    mocks.orderFindFirst.mockResolvedValue({ id: "order-1", payment_status: "PAID", price: 100 })
    await expect(
      payOrderFromWallet("order-1", "consumer-1", "user-1")
    ).rejects.toBeInstanceOf(AppError)
  })

  it("rejects insufficient balance without creating a payment or reservation", async () => {
    mocks.orderFindFirst.mockResolvedValue({ id: "order-1", payment_status: "PENDING", price: 500 })
    mocks.accountUpsert.mockResolvedValue({
      id: "acc-1",
      available_balance: 100n,
      reserved_balance: 0n,
      balance: 1,
    })
    mocks.reservationFindUnique.mockResolvedValue(null)
    mocks.accountUpdateMany.mockResolvedValue({ count: 0 })

    await expect(
      payOrderFromWallet("order-1", "consumer-1", "user-1")
    ).rejects.toMatchObject({ message: "Insufficient balance" })
    expect(mocks.paymentCreate).not.toHaveBeenCalled()
    expect(mocks.orderUpdate).not.toHaveBeenCalled()
    expect(mocks.reservationCreate).not.toHaveBeenCalled()
  })

  it("reserves funds and marks order paid atomically on success", async () => {
    mocks.orderFindFirst.mockResolvedValue({ id: "order-1", payment_status: "PENDING", price: 500 })
    mocks.accountUpsert.mockResolvedValue({
      id: "acc-1",
      available_balance: 100000n,
      reserved_balance: 0n,
      balance: 1000,
    })
    mocks.reservationFindUnique.mockResolvedValue(null)
    mocks.accountUpdateMany.mockResolvedValue({ count: 1 })
    mocks.accountFindUnique.mockResolvedValue({
      id: "acc-1",
      available_balance: 50000n,
      reserved_balance: 50000n,
      balance: 1000,
    })
    mocks.accountUpdate.mockResolvedValue({
      id: "acc-1",
      available_balance: 50000n,
      reserved_balance: 50000n,
      balance: 500,
    })
    mocks.reservationCreate.mockResolvedValue({ id: "res-1", amount_kobo: 50000n })
    mocks.transactionCreate.mockResolvedValue({ id: "lt-1" })
    mocks.paymentCreate.mockResolvedValue({ id: "pay-1" })
    mocks.orderUpdate.mockResolvedValue({ id: "order-1" })

    const result = await payOrderFromWallet("order-1", "consumer-1", "user-1")

    expect(result.message).toBe("Order paid from wallet")
    const reserveWhere = mocks.accountUpdateMany.mock.calls[0][0].where
    expect(reserveWhere.available_balance.gte).toBe(50000n)
    expect(mocks.reservationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order_id: "order-1", amount_kobo: 50000n }) })
    )
    expect(mocks.transactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "RESERVATION", direction: "DEBIT", reference: "RESERVE_order-1" }),
      })
    )
    expect(mocks.paymentCreate).toHaveBeenCalledTimes(1)
    expect(mocks.orderUpdate).toHaveBeenCalledTimes(1)
  })
})