import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  organizationFindUnique: vi.fn(),
  vehicleCreate: vi.fn(),
  vehicleFindMany: vi.fn(),
  vehicleFindFirst: vi.fn(),
  riderFindFirst: vi.fn(),
  riderVehicleFindFirst: vi.fn(),
  riderVehicleCreate: vi.fn(),
  riderVehicleUpdate: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    organization: { findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a) },
    vehicle: {
      create: (...a: unknown[]) => mocks.vehicleCreate(...a),
      findMany: (...a: unknown[]) => mocks.vehicleFindMany(...a),
      findFirst: (...a: unknown[]) => mocks.vehicleFindFirst(...a),
    },
    rider: { findFirst: (...a: unknown[]) => mocks.riderFindFirst(...a) },
    riderVehicle: {
      findFirst: (...a: unknown[]) => mocks.riderVehicleFindFirst(...a),
      create: (...a: unknown[]) => mocks.riderVehicleCreate(...a),
      update: (...a: unknown[]) => mocks.riderVehicleUpdate(...a),
    },
  },
}))

import { createVehicle, listVehicles, assignVehicle, unassignVehicle } from "./vehicle.service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createVehicle", () => {
  it("throws when organization not a logistics company", async () => {
    mocks.organizationFindUnique.mockResolvedValue({ id: "org-1", type: "MERCHANT" })
    await expect(createVehicle("org-1", { type: "CAR" })).rejects.toMatchObject({ message: "Vehicles can only be added to logistics companies", status: 400 })
  })
})

describe("assignVehicle", () => {
  it("throws when vehicle not found", async () => {
    mocks.vehicleFindFirst.mockResolvedValue(null)
    await expect(assignVehicle("veh-1", "rider-1", "org-1")).rejects.toMatchObject({ message: "Vehicle not found in this organization", status: 404 })
  })
})

describe("unassignVehicle", () => {
  it("throws when active assignment not found", async () => {
    mocks.riderVehicleFindFirst.mockResolvedValue(null)
    await expect(unassignVehicle("veh-1", "rider-1", "org-1")).rejects.toMatchObject({ message: "Active assignment not found", status: 404 })
  })
})
