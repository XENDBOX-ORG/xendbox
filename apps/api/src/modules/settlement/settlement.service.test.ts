import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  organizationFindUnique: vi.fn(),
  settlementFindFirst: vi.fn(),
  settlementItemFindMany: vi.fn(),
  orderFindMany: vi.fn(),
  settlementCreate: vi.fn(),
  transaction: vi.fn((fn: (t: any) => unknown) => fn({
    organization: { findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a) },
    settlement: { findFirst: (...a: unknown[]) => mocks.settlementFindFirst(...a), create: (...a: unknown[]) => mocks.settlementCreate(...a), findMany: vi.fn() },
    settlementItem: { findMany: (...a: unknown[]) => mocks.settlementItemFindMany(...a) },
    order: { findMany: (...a: unknown[]) => mocks.orderFindMany(...a) },
  })),
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

import { generateSettlement, listSettlements, getSettlement } from "./settlement.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction = mocks.transaction as never
  prisma.organization = { findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a) } as never
  prisma.settlement = { findFirst: (...a: unknown[]) => mocks.settlementFindFirst(...a), create: (...a: unknown[]) => mocks.settlementCreate(...a), findMany: vi.fn() } as never
  prisma.settlementItem = { findMany: (...a: unknown[]) => mocks.settlementItemFindMany(...a) } as never
  prisma.order = { findMany: (...a: unknown[]) => mocks.orderFindMany(...a) } as never
})

describe("generateSettlement", () => {
  it("throws when organization not found", async () => {
    mocks.organizationFindUnique.mockResolvedValue(null)
    await expect(generateSettlement("org-1")).rejects.toMatchObject({ message: "Organization not found", status: 404 })
  })

  it("throws when no completed orders to settle", async () => {
    mocks.organizationFindUnique.mockResolvedValue({ id: "org-1", type: "LOGISTICS_COMPANY" })
    mocks.settlementFindFirst.mockResolvedValue(null)
    mocks.settlementItemFindMany.mockResolvedValue([])
    mocks.orderFindMany.mockResolvedValue([])
    await expect(generateSettlement("org-1")).rejects.toMatchObject({ message: "No completed orders to settle", status: 400 })
  })
})

describe("listSettlements", () => {
  it("returns settlements", async () => {
    prisma.settlement.findMany = vi.fn().mockResolvedValue([])
    const result = await listSettlements("org-1")
    expect(result).toEqual([])
  })
})

describe("getSettlement", () => {
  it("throws when settlement not found", async () => {
    mocks.settlementFindFirst.mockResolvedValue(null)
    await expect(getSettlement("settle-1", "org-1")).rejects.toMatchObject({ message: "Settlement not found", status: 404 })
  })
})
