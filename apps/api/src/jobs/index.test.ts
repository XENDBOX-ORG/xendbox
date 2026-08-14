import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = {
  dispatchFindUnique: vi.fn(),
  dispatchUpdate: vi.fn(),
  attemptUpdateMany: vi.fn(),
  orderUpdate: vi.fn(),
  orderUpdateMany: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    dispatch: {
      findUnique: (...a: unknown[]) => mocks.dispatchFindUnique(...a),
      update: (...a: unknown[]) => mocks.dispatchUpdate(...a),
    },
    dispatchAttempt: { updateMany: (...a: unknown[]) => mocks.attemptUpdateMany(...a) },
    order: {
      update: (...a: unknown[]) => mocks.orderUpdate(...a),
      updateMany: (...a: unknown[]) => mocks.orderUpdateMany(...a),
    },
  },
}))

vi.mock("@xendbox/redis", () => ({
  isRedisAvailable: () => false,
  getRedisClient: () => null,
}))

import {
  enqueueDispatchTimeout,
  cancelDispatchTimeout,
  enqueueOrderExpiry,
  cancelOrderExpiry,
} from "./index"

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe("jobs without Redis", () => {
  it("falls back to in-process timers for dispatch timeout", async () => {
    vi.useFakeTimers()
    mocks.dispatchFindUnique.mockResolvedValue({
      id: "d-1",
      status: "SEARCHING",
      order_id: "o-1",
    })

    const token = await enqueueDispatchTimeout("d-1")
    expect(token).toMatch(/^local:/)

    await vi.advanceTimersByTimeAsync(61_000)

    expect(mocks.dispatchFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "d-1" } })
    )
    expect(mocks.dispatchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "EXPIRED" } })
    )
    expect(mocks.attemptUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "TIMEOUT" } })
    )
  })

  it("cancelDispatchTimeout clears the in-process timer", async () => {
    vi.useFakeTimers()
    mocks.dispatchFindUnique.mockResolvedValue({
      id: "d-2",
      status: "SEARCHING",
      order_id: "o-2",
    })

    await enqueueDispatchTimeout("d-2")
    await cancelDispatchTimeout("d-2")

    await vi.advanceTimersByTimeAsync(61_000)
    expect(mocks.dispatchFindUnique).not.toHaveBeenCalled()
  })

  it("does not expire a dispatch that is no longer searching", async () => {
    vi.useFakeTimers()
    mocks.dispatchFindUnique.mockResolvedValue({ status: "RIDER_ACCEPTED" })

    await enqueueDispatchTimeout("d-3")
    await vi.advanceTimersByTimeAsync(61_000)
    expect(mocks.dispatchUpdate).not.toHaveBeenCalled()
  })

  it("falls back to in-process timers for unpaid order expiry", async () => {
    vi.useFakeTimers()
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 })

    const token = await enqueueOrderExpiry("o-1")
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 + 1000)

    expect(mocks.orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "o-1", payment_status: "PENDING" }),
      })
    )
    expect(token).toBeTruthy()
  })

  it("cancelOrderExpiry clears the in-process timer", async () => {
    vi.useFakeTimers()
    await enqueueOrderExpiry("o-2")
    await cancelOrderExpiry("o-2")
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 + 1000)
    expect(mocks.orderUpdateMany).not.toHaveBeenCalled()
  })
})