import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  transaction: vi.fn(),
}

const storeFn = vi.fn()
const readyFn = vi.fn()
const findUniqueOrThrow = vi.fn()
const orderUpdate = vi.fn()

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

import { markParcelStored, markReadyForCollection } from "./pickup-station.service"
import { prisma } from "@xendbox/database"

function makeTx(updateMany: vi.Mock) {
  return {
    stationParcel: {
      updateMany,
      findUniqueOrThrow: (...a: unknown[]) => findUniqueOrThrow(...a),
    },
    order: { update: (...a: unknown[]) => orderUpdate(...a) },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("markParcelStored", () => {
  it("only transitions ARRIVED parcels to STORED", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const tx = makeTx(updateMany)
    mocks.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    findUniqueOrThrow.mockResolvedValue({
      id: "parcel-1",
      order_id: "order-1",
      status: "STORED",
    })
    orderUpdate.mockResolvedValue({ id: "order-1" })

    await markParcelStored("parcel-1", "station-1")

    expect(updateMany.mock.calls[0][0].where.status).toBe("ARRIVED")
    expect(updateMany.mock.calls[0][0].data.status).toBe("STORED")
    expect(orderUpdate.mock.calls[0][0].data.events.create.event_type).toBe("PARCEL_STORED")
  })

  it("rejects if the parcel is not in ARRIVED state", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 })
    const tx = makeTx(updateMany)
    mocks.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    await expect(markParcelStored("parcel-1", "station-1")).rejects.toMatchObject({
      message: "Parcel not found or not in ARRIVED state",
    })
    expect(orderUpdate).not.toHaveBeenCalled()
  })
})

describe("markReadyForCollection", () => {
  it("accepts an ARRIVED or STORED parcel", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const tx = makeTx(updateMany)
    mocks.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    findUniqueOrThrow.mockResolvedValue({
      id: "parcel-1",
      order_id: "order-1",
      status: "READY_FOR_COLLECTION",
    })
    orderUpdate.mockResolvedValue({ id: "order-1" })

    await markReadyForCollection("parcel-1", "station-1")

    const where = updateMany.mock.calls[0][0].where
    expect(where.status.in).toContain("ARRIVED")
    expect(where.status.in).toContain("STORED")
    expect(updateMany.mock.calls[0][0].data.status).toBe("READY_FOR_COLLECTION")
  })
})