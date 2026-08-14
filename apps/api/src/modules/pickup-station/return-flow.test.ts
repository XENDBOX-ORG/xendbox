import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = {
  transaction: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {},
}))

import { markParcelReturned } from "./pickup-station.service"
import { prisma } from "@xendbox/database"

const findUniqueOrThrow = vi.fn()
const orderUpdate = vi.fn()

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

describe("markParcelReturned", () => {
  it("transitions an ARRIVED/STORED/READY parcel to RETURNED and marks the order", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const tx = makeTx(updateMany)
    mocks.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    findUniqueOrThrow.mockResolvedValue({ id: "parcel-1", order_id: "order-1", status: "RETURNED" })
    orderUpdate.mockResolvedValue({ id: "order-1" })

    await markParcelReturned("parcel-1", "station-1")

    expect(updateMany.mock.calls[0][0].where.status.in).toEqual([
      "ARRIVED",
      "STORED",
      "READY_FOR_COLLECTION",
    ])
    expect(updateMany.mock.calls[0][0].data.status).toBe("RETURNED")
    expect(orderUpdate.mock.calls[0][0].data.status).toBe("RETURNED")
    expect(orderUpdate.mock.calls[0][0].data.events.create.event_type).toBe("RETURNED")
  })

  it("rejects a parcel not in a returnable state", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 })
    const tx = makeTx(updateMany)
    mocks.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
    prisma.$transaction = mocks.transaction as never

    await expect(markParcelReturned("parcel-1", "station-1")).rejects.toMatchObject({
      message: "Parcel not found or not in a returnable state",
      status: 404,
    })
  })
})