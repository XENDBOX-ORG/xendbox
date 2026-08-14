import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  findMany: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    notification: {
      findMany: (...a: unknown[]) => mocks.findMany(...a),
      count: (...a: unknown[]) => mocks.count(...a),
      updateMany: (...a: unknown[]) => mocks.updateMany(...a),
    },
  },
}))

import { listNotifications, markRead, markAllRead } from "./notification.service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listNotifications", () => {
  it("paginates and returns unread count", async () => {
    mocks.findMany.mockResolvedValue([{ id: "n-1" }])
    mocks.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3)

    const result = await listNotifications("user-1", 1, 20)

    expect(result.items).toEqual([{ id: "n-1" }])
    expect(result.total).toBe(10)
    expect(result.unread).toBe(3)
    expect(mocks.findMany.mock.calls[0][0].where.user_id).toBe("user-1")
  })

  it("filters by unread when requested", async () => {
    mocks.findMany.mockResolvedValue([])
    mocks.count.mockResolvedValue(0)

    await listNotifications("user-1", 2, 10, true)

    expect(mocks.findMany.mock.calls[0][0].where.read_at).toBeNull()
    expect(mocks.findMany.mock.calls[0][0].skip).toBe(10)
  })
})

describe("markRead", () => {
  it("marks a notification read for the owner", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 })
    const result = await markRead("user-1", "n-1")
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "n-1", user_id: "user-1" } })
    )
    expect(result).toEqual({ message: "Notification marked as read" })
  })

  it("throws 404 when the notification does not belong to the user", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 })
    await expect(markRead("user-1", "n-99")).rejects.toBeInstanceOf(AppError)
  })
})

describe("markAllRead", () => {
  it("marks all unread notifications read", async () => {
    mocks.updateMany.mockResolvedValue({ count: 5 })
    const result = await markAllRead("user-1")
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: "user-1", read_at: null } })
    )
    expect(result.message).toContain("5")
  })
})