import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  financialAccountUpsert: vi.fn(),
  financialAccountUpdate: vi.fn(),
  financialAccountUpdateMany: vi.fn(),
  financialAccountFindUnique: vi.fn(),
  reservationFindUnique: vi.fn(),
  reservationUpdateMany: vi.fn(),
  reservationCreate: vi.fn(),
  financialTransactionCreate: vi.fn(),
  financialTransactionFindUnique: vi.fn(),
  financialTransactionFindMany: vi.fn(),
  orderFindUnique: vi.fn(),
  riderEarningRecordCreate: vi.fn(),
  userFindUnique: vi.fn(),
  organizationFindUnique: vi.fn(),
  providerVirtualAccountFindUnique: vi.fn(),
  providerVirtualAccountCreate: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

vi.mock("../../lib/money", () => ({
  koboToNaira: vi.fn((n: bigint) => Number(n) / 100),
}))

vi.mock("../../lib/monnify", () => ({
  monnify: { createVirtualAccount: vi.fn() },
}))

import { getOrCreateUserAccount, getOrCreateOrganizationAccount, getOrCreatePlatformAccount, getOrCreateAccountForOwner, creditAvailable, reserveForOrder, releaseReservationForOrder, settleDelivery, holdForWithdrawal, reverseWithdrawalHold, consumeWithdrawalHold, listAccountTransactions, reverseFunding, getVirtualAccountForAccount, creditAccount, debitAccount } from "./financial.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
  prisma.financialAccount = {
    upsert: (...a: unknown[]) => mocks.financialAccountUpsert(...a),
    update: (...a: unknown[]) => mocks.financialAccountUpdate(...a),
    updateMany: (...a: unknown[]) => mocks.financialAccountUpdateMany(...a),
    findUnique: (...a: unknown[]) => mocks.financialAccountFindUnique(...a),
  } as never
  prisma.reservation = {
    findUnique: (...a: unknown[]) => mocks.reservationFindUnique(...a),
    updateMany: (...a: unknown[]) => mocks.reservationUpdateMany(...a),
    create: (...a: unknown[]) => mocks.reservationCreate(...a),
  } as never
  prisma.financialTransaction = {
    create: (...a: unknown[]) => mocks.financialTransactionCreate(...a),
    findUnique: (...a: unknown[]) => mocks.financialTransactionFindUnique(...a),
    findMany: (...a: unknown[]) => mocks.financialTransactionFindMany(...a),
  } as never
  prisma.order = { findUnique: (...a: unknown[]) => mocks.orderFindUnique(...a) } as never
  prisma.riderEarningRecord = { create: (...a: unknown[]) => mocks.riderEarningRecordCreate(...a) } as never
  prisma.user = { findUnique: (...a: unknown[]) => mocks.userFindUnique(...a) } as never
  prisma.organization = { findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a) } as never
  prisma.providerVirtualAccount = {
    findUnique: (...a: unknown[]) => mocks.providerVirtualAccountFindUnique(...a),
    create: (...a: unknown[]) => mocks.providerVirtualAccountCreate(...a),
  } as never
})

describe("getOrCreateUserAccount", () => {
  it("creates or returns a user account", async () => {
    mocks.financialAccountUpsert.mockResolvedValue({ id: "acc-1" })
    const result = await getOrCreateUserAccount("user-1")
    expect(result).toHaveProperty("id")
  })
})

describe("getOrCreateOrganizationAccount", () => {
  it("creates or returns an org account", async () => {
    mocks.financialAccountUpsert.mockResolvedValue({ id: "acc-2" })
    const result = await getOrCreateOrganizationAccount("org-1")
    expect(result).toHaveProperty("id")
  })
})

describe("getOrCreatePlatformAccount", () => {
  it("creates or returns a platform account", async () => {
    mocks.financialAccountUpsert.mockResolvedValue({ id: "acc-platform" })
    const result = await getOrCreatePlatformAccount()
    expect(result).toHaveProperty("id")
  })
})

describe("getOrCreateAccountForOwner", () => {
  it("creates or returns an account for owner", async () => {
    mocks.financialAccountUpsert.mockResolvedValue({ id: "acc-3" })
    const result = await getOrCreateAccountForOwner(prisma as any, "USER", "user-1")
    expect(result).toHaveProperty("id")
  })
})

describe("creditAvailable", () => {
  it("throws when amount is not positive", async () => {
    await expect(creditAvailable(prisma as any, "acc-1", 0n, { reference: "ref", source: "src", type: "FUNDING", direction: "CREDIT" })).rejects.toMatchObject({ message: "Amount must be positive", status: 400 })
  })
})

describe("reserveForOrder", () => {
  it("throws when amount is not positive", async () => {
    await expect(reserveForOrder(prisma as any, "acc-1", "order-1", 0n, "src")).rejects.toMatchObject({ message: "Amount must be positive", status: 400 })
  })
})

describe("reverseFunding", () => {
  it("throws when amount is not positive", async () => {
    await expect(reverseFunding(prisma as any, "acc-1", 0n, "ref")).rejects.toMatchObject({ message: "Amount must be positive", status: 400 })
  })
})

describe("getVirtualAccountForAccount", () => {
  it("returns virtual account", async () => {
    mocks.providerVirtualAccountFindUnique.mockResolvedValue(null)
    const result = await getVirtualAccountForAccount("acc-1")
    expect(result).toBeNull()
  })
})

describe("listAccountTransactions", () => {
  it("returns transactions", async () => {
    mocks.financialTransactionFindMany.mockResolvedValue([])
    const result = await listAccountTransactions("acc-1")
    expect(result).toEqual([])
  })
})
