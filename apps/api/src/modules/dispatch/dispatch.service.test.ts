import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  orderFindFirst: vi.fn(),
  addressFindUnique: vi.fn(),
  dispatchCreate: vi.fn(),
  dispatchFindUnique: vi.fn(),
  dispatchUpdate: vi.fn(),
  dispatchAttemptCreateMany: vi.fn(),
  dispatchAttemptFindUnique: vi.fn(),
  dispatchAttemptUpdateMany: vi.fn(),
  orderUpdate: vi.fn(),
  riderAvailabilityUpdate: vi.fn(),
  dispatchAttemptFindMany: vi.fn(),
  transaction: vi.fn((fn: (t: any) => unknown) => fn({
      order: { findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a), update: (...a: unknown[]) => mocks.orderUpdate(...a) },
      address: { findUnique: (...a: unknown[]) => mocks.addressFindUnique(...a) },
      dispatch: { create: (...a: unknown[]) => mocks.dispatchCreate(...a), findUnique: (...a: unknown[]) => mocks.dispatchFindUnique(...a), update: (...a: unknown[]) => mocks.dispatchUpdate(...a) },
      dispatchAttempt: { createMany: (...a: unknown[]) => mocks.dispatchAttemptCreateMany(...a), findUnique: (...a: unknown[]) => mocks.dispatchAttemptFindUnique(...a), updateMany: (...a: unknown[]) => mocks.dispatchAttemptUpdateMany(...a), findMany: (...a: unknown[]) => mocks.dispatchAttemptFindMany(...a) },
      riderAvailability: { update: (...a: unknown[]) => mocks.riderAvailabilityUpdate(...a) },
    }))
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

vi.mock("@xendbox/maps", () => ({
  geoFindNearby: vi.fn().mockResolvedValue([]),
  geoRemoveRider: vi.fn(),
}))

vi.mock("../../jobs", () => ({
  enqueueDispatchTimeout: vi.fn(),
  cancelDispatchTimeout: vi.fn(),
}))

vi.mock("../../shared/notify", () => ({
  notifyOrderDelivery: vi.fn(),
  sendFireAndForget: vi.fn((fn: () => unknown) => fn()),
}))

import { startDispatch, acceptAttempt, declineAttempt, getDispatchByOrder, getPendingAttempts } from "./dispatch.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction = mocks.transaction as never
  prisma.order = { findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a), update: (...a: unknown[]) => mocks.orderUpdate(...a) } as never
  prisma.address = { findUnique: (...a: unknown[]) => mocks.addressFindUnique(...a) } as never
  prisma.dispatch = { create: (...a: unknown[]) => mocks.dispatchCreate(...a), findUnique: (...a: unknown[]) => mocks.dispatchFindUnique(...a), update: (...a: unknown[]) => mocks.dispatchUpdate(...a) } as never
  prisma.dispatchAttempt = { createMany: (...a: unknown[]) => mocks.dispatchAttemptCreateMany(...a), findUnique: (...a: unknown[]) => mocks.dispatchAttemptFindUnique(...a), updateMany: (...a: unknown[]) => mocks.dispatchAttemptUpdateMany(...a), findMany: (...a: unknown[]) => mocks.dispatchAttemptFindMany(...a) } as never
  prisma.riderAvailability = { update: (...a: unknown[]) => mocks.riderAvailabilityUpdate(...a) } as never
  prisma.rider = { findMany: vi.fn() } as never
})

describe("startDispatch", () => {
  it("throws when order not found", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(startDispatch("order-1", "consumer-1")).rejects.toMatchObject({ message: "Order not found", status: 404 })
  })

  it("throws when order is not PAID", async () => {
    mocks.orderFindFirst.mockResolvedValue({ id: "order-1", consumer_id: "consumer-1", status: "PENDING", dispatch: null })
    await expect(startDispatch("order-1", "consumer-1")).rejects.toMatchObject({ message: "Order must be PAID before dispatch", status: 400 })
  })

  it("throws when pickup address lacks coordinates", async () => {
    mocks.orderFindFirst.mockResolvedValue({ id: "order-1", consumer_id: "consumer-1", status: "PAID", dispatch: null })
    mocks.addressFindUnique.mockResolvedValue({ id: "addr-1", latitude: null, longitude: null })
    await expect(startDispatch("order-1", "consumer-1")).rejects.toMatchObject({ message: "Pickup address must have coordinates for dispatch", status: 400 })
  })
})

describe("acceptAttempt", () => {
  it("throws when attempt not found", async () => {
    mocks.dispatchAttemptFindUnique.mockResolvedValue(null)
    await expect(acceptAttempt("attempt-1", "rider-1")).rejects.toMatchObject({ message: "Dispatch attempt not found", status: 404 })
  })
})

describe("declineAttempt", () => {
  it("throws when attempt not found", async () => {
    mocks.dispatchAttemptFindUnique.mockResolvedValue(null)
    await expect(declineAttempt("attempt-1", "rider-1")).rejects.toMatchObject({ message: "Dispatch attempt not found", status: 404 })
  })
})

describe("getDispatchByOrder", () => {
  it("throws when order not found", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(getDispatchByOrder("order-1", "consumer-1")).rejects.toMatchObject({ message: "Order not found", status: 404 })
  })
})

describe("getPendingAttempts", () => {
  it("returns pending attempts for rider", async () => {
    mocks.dispatchAttemptFindMany.mockResolvedValue([])
    const result = await getPendingAttempts("rider-1")
    expect(Array.isArray(result)).toBe(true)
  })
})
