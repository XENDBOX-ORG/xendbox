import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  riderLocationHistoryCreate: vi.fn(),
  riderAvailabilityUpdate: vi.fn(),
  orderFindFirst: vi.fn(),
  riderLocationHistoryFindFirst: vi.fn(),
  riderLocationHistoryFindMany: vi.fn(),
  transaction: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

vi.mock("@xendbox/maps", () => ({
  geoAddRider: vi.fn(),
}))

import { updateLocation, getRiderLocationForOrder, getRiderLocationHistory } from "./tracking.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction = mocks.transaction as never
  prisma.riderLocationHistory = {
    create: (...a: unknown[]) => mocks.riderLocationHistoryCreate(...a),
    findFirst: (...a: unknown[]) => mocks.riderLocationHistoryFindFirst(...a),
    findMany: (...a: unknown[]) => mocks.riderLocationHistoryFindMany(...a),
  } as never
  prisma.riderAvailability = {
    update: (...a: unknown[]) => mocks.riderAvailabilityUpdate(...a),
  } as never
  prisma.order = {
    findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a),
  } as never
})

describe("updateLocation", () => {
  it("returns message after updating location", async () => {
    mocks.riderLocationHistoryCreate.mockResolvedValue({ id: "hist-1" })
    mocks.riderAvailabilityUpdate.mockResolvedValue({ id: "avail-1" })
    const result = await updateLocation("rider-1", { latitude: 6.454, longitude: 3.406 })
    expect(result).toMatchObject({ message: "Location updated" })
  })
})

describe("getRiderLocationForOrder", () => {
  it("throws when order not found", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(getRiderLocationForOrder("order-1", "consumer-1")).rejects.toMatchObject({ message: "Order not found", status: 404 })
  })
})

describe("getRiderLocationHistory", () => {
  it("returns location history", async () => {
    mocks.riderLocationHistoryFindMany.mockResolvedValue([])
    const result = await getRiderLocationHistory("rider-1")
    expect(result).toEqual([])
  })
})
