import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  deliveryOptionFindUnique: vi.fn(),
  pickupStationFindFirst: vi.fn(),
  recipientFindFirst: vi.fn(),
  addressFindUnique: vi.fn(),
  orderCreate: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    deliveryOption: { findUnique: (...a: unknown[]) => mocks.deliveryOptionFindUnique(...a) },
    pickupStation: { findFirst: (...a: unknown[]) => mocks.pickupStationFindFirst(...a) },
    recipient: { findFirst: (...a: unknown[]) => mocks.recipientFindFirst(...a) },
    address: { findUnique: (...a: unknown[]) => mocks.addressFindUnique(...a) },
    order: { create: (...a: unknown[]) => mocks.orderCreate(...a) },
  },
}))

import { createOrder } from "./order.service"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.recipientFindFirst.mockResolvedValue({ id: "recipient-1" })
  mocks.addressFindUnique.mockResolvedValue({ id: "address-1" })
  mocks.orderCreate.mockImplementation(({ data, include }) =>
    Promise.resolve({ id: "order-1", ...data, delivery_option: {}, pickup_address: {}, recipient: {}, events: [] })
  )
})

describe("createOrder pickup_station_id handoff", () => {
  it("requires pickup_station_id for PICKUP_STATION delivery", async () => {
    mocks.deliveryOptionFindUnique.mockResolvedValue({ id: "opt-1", type: "PICKUP_STATION" })

    await expect(
      createOrder("consumer-1", {
        delivery_option_id: "opt-1",
        pickup_address_id: "address-1",
        recipient_id: "recipient-1",
        price: 100,
      })
    ).rejects.toMatchObject({ message: "pickup_station_id is required for pickup station delivery" })
    expect(mocks.orderCreate).not.toHaveBeenCalled()
  })

  it("rejects an inactive pickup station", async () => {
    mocks.deliveryOptionFindUnique.mockResolvedValue({ id: "opt-1", type: "PICKUP_STATION" })
    mocks.pickupStationFindFirst.mockResolvedValue(null)

    await expect(
      createOrder("consumer-1", {
        delivery_option_id: "opt-1",
        pickup_address_id: "address-1",
        recipient_id: "recipient-1",
        price: 100,
        pickup_station_id: "station-1",
      })
    ).rejects.toMatchObject({ message: "Pickup station not found or inactive" })
  })

  it("sets pickup_station_id on the order for a valid PICKUP_STATION delivery", async () => {
    mocks.deliveryOptionFindUnique.mockResolvedValue({ id: "opt-1", type: "PICKUP_STATION" })
    mocks.pickupStationFindFirst.mockResolvedValue({ id: "station-1", status: "ACTIVE" })

    await createOrder("consumer-1", {
      delivery_option_id: "opt-1",
      pickup_address_id: "address-1",
      recipient_id: "recipient-1",
      price: 100,
      pickup_station_id: "station-1",
    })

    expect(mocks.orderCreate.mock.calls[0][0].data.pickup_station_id).toBe("station-1")
  })

  it("ignores pickup_station_id for HOME delivery", async () => {
    mocks.deliveryOptionFindUnique.mockResolvedValue({ id: "opt-2", type: "HOME" })

    await createOrder("consumer-1", {
      delivery_option_id: "opt-2",
      pickup_address_id: "address-1",
      recipient_id: "recipient-1",
      price: 100,
      pickup_station_id: "station-1",
    })

    expect(mocks.pickupStationFindFirst).not.toHaveBeenCalled()
    expect(mocks.orderCreate.mock.calls[0][0].data.pickup_station_id).toBeUndefined()
  })
})