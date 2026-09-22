import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  withdrawalCreate: vi.fn(),
  withdrawalUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  withdrawalFindUnique: vi.fn(),
  withdrawalFindMany: vi.fn(),
  withdrawalFindFirst: vi.fn(),
  transaction: vi.fn((fn: (t: any) => unknown) => fn({
    withdrawal: { create: (...a: unknown[]) => mocks.withdrawalCreate(...a), updateMany: (...a: unknown[]) => mocks.withdrawalUpdateMany(...a), findUnique: (...a: unknown[]) => mocks.withdrawalFindUnique(...a), findFirst: (...a: unknown[]) => mocks.withdrawalFindFirst(...a) },
    financialAccount: { upsert: vi.fn(), findUnique: vi.fn() },
    rider: { findUnique: vi.fn() },
    organizationMember: { findMany: vi.fn() },
  })),
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

vi.mock("../../lib/money", () => ({
  toKobo: vi.fn((n: number) => BigInt(Math.round(n * 100))),
}))

vi.mock("../../lib/monnify", () => ({
  monnify: { initiatePayout: vi.fn().mockResolvedValue({ status: "SUCCESSFUL", transactionReference: "tx-1" }) },
}))

vi.mock("../financial/actor", () => ({
  getWithdrawableAccountForUser: vi.fn().mockResolvedValue({ accountId: "acc-1" }),
}))

vi.mock("../financial/financial.service", () => ({
  holdForWithdrawal: vi.fn(),
  reverseWithdrawalHold: vi.fn(),
  consumeWithdrawalHold: vi.fn(),
}))

import { requestWithdrawal, initiateWithdrawalPayout, confirmWithdrawalOutcome, listWithdrawalsForUser, getWithdrawalForUser } from "./withdrawal.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction = mocks.transaction as never
  prisma.withdrawal = { create: (...a: unknown[]) => mocks.withdrawalCreate(...a), updateMany: (...a: unknown[]) => mocks.withdrawalUpdateMany(...a), findUnique: (...a: unknown[]) => mocks.withdrawalFindUnique(...a), findMany: (...a: unknown[]) => mocks.withdrawalFindMany(...a), findFirst: (...a: unknown[]) => mocks.withdrawalFindFirst(...a) } as never
})

describe("requestWithdrawal", () => {
  it("throws when account not eligible", async () => {
    const { getWithdrawableAccountForUser } = await import("../financial/actor")
    getWithdrawableAccountForUser.mockResolvedValue(null)
    await expect(requestWithdrawal("user-1", { amount: 100, bankCode: "044", accountNumber: "123", accountName: "Test" })).rejects.toMatchObject({ message: "Your account is not eligible for withdrawals", status: 403 })
  })
})

describe("initiateWithdrawalPayout", () => {
  it("returns initiated false when no provider_reference", async () => {
    mocks.withdrawalFindUnique.mockResolvedValue(null)
    const result = await initiateWithdrawalPayout("wd-1")
    expect(result.initiated).toBe(false)
  })
})

describe("confirmWithdrawalOutcome", () => {
  it("returns confirmed false when withdrawal not found", async () => {
    mocks.withdrawalFindUnique.mockResolvedValue(null)
    const result = await confirmWithdrawalOutcome("ref-1", true)
    expect(result.confirmed).toBe(false)
  })
})

describe("listWithdrawalsForUser", () => {
  it("returns empty array when not eligible", async () => {
    const { getWithdrawableAccountForUser } = await import("../financial/actor")
    getWithdrawableAccountForUser.mockResolvedValue(null)
    const result = await listWithdrawalsForUser("user-1")
    expect(result).toEqual([])
  })
})

describe("getWithdrawalForUser", () => {
  it("throws when account not eligible", async () => {
    const { getWithdrawableAccountForUser } = await import("../financial/actor")
    getWithdrawableAccountForUser.mockResolvedValue(null)
    await expect(getWithdrawalForUser("user-1", "wd-1")).rejects.toMatchObject({ message: "Your account is not eligible for withdrawals", status: 403 })
  })
})
