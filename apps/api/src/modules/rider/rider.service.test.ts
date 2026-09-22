import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  riderFindUnique: vi.fn(),
  riderCreate: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationMemberFindUnique: vi.fn(),
  riderAvailabilityUpsert: vi.fn(),
  riderAvailabilityFindUnique: vi.fn(),
  riderFindMany: vi.fn(),
  geoAddRider: vi.fn(),
  geoRemoveRider: vi.fn(),
  geoFindNearby: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    rider: {
      findUnique: (...a: unknown[]) => mocks.riderFindUnique(...a),
      create: (...a: unknown[]) => mocks.riderCreate(...a),
      findMany: (...a: unknown[]) => mocks.riderFindMany(...a),
    },
    organization: { findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a) },
    organizationMember: { findUnique: (...a: unknown[]) => mocks.organizationMemberFindUnique(...a) },
    riderAvailability: {
      upsert: (...a: unknown[]) => mocks.riderAvailabilityUpsert(...a),
      findUnique: (...a: unknown[]) => mocks.riderAvailabilityFindUnique(...a),
    },
  },
}))

vi.mock("@xendbox/maps", () => ({
  geoAddRider: vi.fn(),
  geoRemoveRider: vi.fn(),
  geoFindNearby: vi.fn().mockResolvedValue([]),
}))

vi.mock("../../shared/notify", () => ({
  sendWelcomeEmail: vi.fn(),
}))

import { createRider, getRiderByUserId, getRiderById, updateAvailability, getAvailability, listNearbyRiders } from "./rider.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createRider", () => {
  it("throws when rider already exists", async () => {
    mocks.riderFindUnique.mockResolvedValue({ id: "rider-1" })
    await expect(createRider("user-1", { type: "INDEPENDENT" })).rejects.toMatchObject({ message: "Rider profile already exists", status: 409 })
  })
})

describe("getRiderByUserId", () => {
  it("throws when rider not found", async () => {
    mocks.riderFindUnique.mockResolvedValue(null)
    await expect(getRiderByUserId("user-1")).rejects.toMatchObject({ message: "Rider profile not found", status: 404 })
  })
})

describe("getRiderById", () => {
  it("throws when rider not found", async () => {
    mocks.riderFindUnique.mockResolvedValue(null)
    await expect(getRiderById("rider-1")).rejects.toMatchObject({ message: "Rider not found", status: 404 })
  })
})

describe("updateAvailability", () => {
  it("throws when rider not found", async () => {
    mocks.riderFindUnique.mockResolvedValue(null)
    await expect(updateAvailability("rider-1", { status: "ONLINE" })).rejects.toMatchObject({ message: "Rider not found", status: 404 })
  })
})

describe("getAvailability", () => {
  it("throws when availability not set", async () => {
    mocks.riderAvailabilityFindUnique.mockResolvedValue(null)
    await expect(getAvailability("rider-1")).rejects.toMatchObject({ message: "Availability not set", status: 404 })
  })
})

describe("listNearbyRiders", () => {
  it("returns empty array when no nearby riders", async () => {
    mocks.geoFindNearby.mockResolvedValue([])
    const result = await listNearbyRiders(0, 0)
    expect(result).toEqual([])
  })
})
