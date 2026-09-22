import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  orderFindFirst: vi.fn(),
  orderCreate: vi.fn(),
  orderUpdate: vi.fn(),
  orderCount: vi.fn(),
  orderFindMany: vi.fn(),
  deliveryOptionFindUnique: vi.fn(),
  pickupStationFindFirst: vi.fn(),
  recipientFindFirst: vi.fn(),
  addressFindUnique: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    order: {
      findFirst: (...a: unknown[]) => mocks.orderFindFirst(...a),
      create: (...a: unknown[]) => mocks.orderCreate(...a),
      update: (...a: unknown[]) => mocks.orderUpdate(...a),
      count: (...a: unknown[]) => mocks.orderCount(...a),
      findMany: (...a: unknown[]) => mocks.orderFindMany(...a),
    },
    deliveryOption: { findUnique: (...a: unknown[]) => mocks.deliveryOptionFindUnique(...a) },
    pickupStation: { findFirst: (...a: unknown[]) => mocks.pickupStationFindFirst(...a) },
    recipient: { findFirst: (...a: unknown[]) => mocks.recipientFindFirst(...a) },
    address: { findUnique: (...a: unknown[]) => mocks.addressFindUnique(...a) },
  },
}))

import { createOrder, getOrderById, listOrders } from "./order.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createOrder", () => {
  it("creates an order with home delivery", async () => {
    mocks.deliveryOptionFindUnique.mockResolvedValue({ id: "opt-1", type: "HOME" })
    mocks.recipientFindFirst.mockResolvedValue({ id: "rec-1" })
    mocks.addressFindUnique.mockResolvedValue({ id: "addr-1" })
    mocks.orderCreate.mockResolvedValue({ id: "order-1", tracking_number: "XND-ABC123" })

    const result = await createOrder("consumer-1", {
      delivery_option_id: "opt-1",
      pickup_address_id: "addr-1",
      recipient_id: "rec-1",
      price: 100,
    })

    expect(mocks.orderCreate).toHaveBeenCalled()
  })
})

describe("getOrderById", () => {
  it("throws when order not found", async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    await expect(getOrderById("order-1", "consumer-1")).rejects.toMatchObject({
      message: "Order not found",
      status: 404,
    })
  })
})

describe("listOrders", () => {
  it("returns orders for consumer", async () => {
    mocks.orderFindMany.mockResolvedValue([])
    const result = await listOrders("consumer-1")
    expect(mocks.orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { consumer_id: "consumer-1" } })
    )
  })
})
