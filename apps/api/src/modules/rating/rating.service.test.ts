import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  transaction: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

import { rateRider, rateStation } from "./rating.service"
import { prisma } from "@xendbox/database"

function makeTx(overrides: Record<string, unknown> = {}) {
  return {
    order: {
      findFirst: vi.fn(),
    },
    riderRating: {
      create: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 4.5 } }),
    },
    rider: { update: vi.fn() },
    stationRating: { create: vi.fn() },
    pickupStation: { findUnique: vi.fn() },
    ...overrides,
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("rateRider", () => {
  it("rejects when the order has no assigned rider", async () => {
    const tx: any = makeTx()
    tx.order.findFirst.mockResolvedValue({ id: "order-1", consumer_id: "c-1", dispatch: {} })
    mocks.transaction.mockImplementation(async (fn: (t: any) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    await expect(
      rateRider("c-1", { order_id: "order-1", rider_id: "r-1", rating: 5 })
    ).rejects.toMatchObject({ message: "No rider was assigned to this order", status: 400 })
  })

  it("rejects when the rider did not deliver the order", async () => {
    const tx: any = makeTx()
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      dispatch: { assigned_rider_id: "other-rider" },
    })
    mocks.transaction.mockImplementation(async (fn: (t: any) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    await expect(
      rateRider("c-1", { order_id: "order-1", rider_id: "r-1", rating: 5 })
    ).rejects.toMatchObject({ message: "Rider was not assigned to this order", status: 400 })
  })

  it("creates the rating and recomputes the rider average after DELIVERED", async () => {
    const tx: any = makeTx()
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      dispatch: { assigned_rider_id: "r-1" },
      status: "DELIVERED",
      rider_rating: null,
    })
    mocks.transaction.mockImplementation(async (fn: (t: any) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    const result = await rateRider("c-1", {
      order_id: "order-1",
      rider_id: "r-1",
      rating: 5,
      comment: "Great ride",
    })

    expect(tx.riderRating.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rider_id: "r-1", rating: 5 }),
      })
    )
    expect(tx.riderRating.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rider_id: "r-1" } })
    )
    expect(tx.rider.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { rating: 4.5 } })
    )
    expect(result).toEqual({ message: "Rider rated successfully" })
  })

  it("rejects a duplicate rating for the same order", async () => {
    const tx: any = makeTx()
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      dispatch: { assigned_rider_id: "r-1" },
      status: "DELIVERED",
      rider_rating: { id: "existing" },
    })
    mocks.transaction.mockImplementation(async (fn: (t: any) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    await expect(
      rateRider("c-1", { order_id: "order-1", rider_id: "r-1", rating: 3 })
    ).rejects.toMatchObject({ message: "Order has already been rated", status: 409 })
  })
})

describe("rateStation", () => {
  it("requires the order to be associated with the station", async () => {
    const tx: any = makeTx()
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      pickup_station_id: "station-2",
    })
    mocks.transaction.mockImplementation(async (fn: (t: any) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    await expect(
      rateStation("c-1", { order_id: "order-1", station_id: "station-1", rating: 4 })
    ).rejects.toMatchObject({ message: "Station was not associated with this order", status: 400 })
  })

  it("creates a station rating for a COLLECTED order", async () => {
    const tx: any = makeTx()
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      pickup_station_id: "station-1",
      status: "COLLECTED",
      station_rating: null,
    })
    tx.pickupStation.findUnique.mockResolvedValue({ id: "station-1" })
    mocks.transaction.mockImplementation(async (fn: (t: any) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    const result = await rateStation("c-1", {
      order_id: "order-1",
      station_id: "station-1",
      rating: 4,
    })

    expect(tx.stationRating.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ station_id: "station-1", rating: 4 }),
      })
    )
    expect(result).toEqual({ message: "Station rated successfully" })
  })
})