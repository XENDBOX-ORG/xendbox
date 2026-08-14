import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = {
  webhookFindMany: vi.fn(),
  deliveryCreate: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    webhook: { findMany: (...a: unknown[]) => mocks.webhookFindMany(...a) },
    webhookDelivery: { create: (...a: unknown[]) => mocks.deliveryCreate(...a) },
  },
}))

import { dispatchWebhook } from "./webhook"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("dispatchWebhook", () => {
  it("does not dispatch when no webhooks match the event", async () => {
    mocks.webhookFindMany.mockResolvedValue([])
    await dispatchWebhook("org-1", "order.status_changed", {})
    expect(mocks.deliveryCreate).not.toHaveBeenCalled()
  })

  it("filters by organization and event", async () => {
    mocks.webhookFindMany.mockResolvedValue([])
    await dispatchWebhook("org-1", "order.status_changed", { order_id: "o-1" })

    expect(mocks.webhookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organization_id: "org-1",
          active: true,
          events: { array_contains: ["order.status_changed"] },
        },
      })
    )
  })

  it("records a delivery on a successful POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 })
    vi.stubGlobal("fetch", fetchMock)
    mocks.webhookFindMany.mockResolvedValue([
      { id: "w-1", url: "https://example.com/hook", secret: null, active: true },
    ])
    mocks.deliveryCreate.mockResolvedValue({})

    await dispatchWebhook("org-1", "order.status_changed", { order_id: "o-1" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://example.com/hook")
    expect(init.method).toBe("POST")
    const sentBody = JSON.parse(init.body)
    expect(sentBody.event).toBe("order.status_changed")
    expect(sentBody.data.order_id).toBe("o-1")

    expect(mocks.deliveryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          webhook_id: "w-1",
          event: "order.status_changed",
          status_code: 200,
        }),
      })
    )
    vi.unstubAllGlobals()
  })

  it("records a failed delivery when the endpoint errors", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"))
    vi.stubGlobal("fetch", fetchMock)
    mocks.webhookFindMany.mockResolvedValue([
      { id: "w-2", url: "https://example.com/hook", secret: null, active: true },
    ])
    mocks.deliveryCreate.mockResolvedValue({})

    await dispatchWebhook("org-1", "order.status_changed", {})

    expect(mocks.deliveryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          webhook_id: "w-2",
          attempts: 1,
          error: "network down",
        }),
      })
    )
    vi.unstubAllGlobals()
  })

  it("does not throw when a webhook fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")))
    mocks.webhookFindMany.mockResolvedValue([
      { id: "w-3", url: "https://example.com/hook", secret: null, active: true },
    ])
    mocks.deliveryCreate.mockResolvedValue({})

    await expect(dispatchWebhook("org-1", "order.status_changed", {})).resolves.toBeUndefined()
    vi.unstubAllGlobals()
  })
})