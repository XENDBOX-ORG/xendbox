import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  consumerFindUnique: vi.fn(),
  consumerCreate: vi.fn(),
  merchantProfileFindUnique: vi.fn(),
  merchantProfileCreate: vi.fn(),
  organizationFindUnique: vi.fn(),
  sendWelcomeEmail: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    consumer: {
      findUnique: (...a: unknown[]) => mocks.consumerFindUnique(...a),
      create: (...a: unknown[]) => mocks.consumerCreate(...a),
    },
    merchantProfile: {
      findUnique: (...a: unknown[]) => mocks.merchantProfileFindUnique(...a),
      create: (...a: unknown[]) => mocks.merchantProfileCreate(...a),
    },
    organization: {
      findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a),
    },
  },
}))

vi.mock("../../shared/notify", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}))

import { createConsumer, getConsumerByUserId } from "./consumer.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createConsumer", () => {
  it("throws when consumer already exists", async () => {
    mocks.consumerFindUnique.mockResolvedValue({ id: "c-1" })
    await expect(createConsumer("user-1", "INDIVIDUAL")).rejects.toMatchObject({
      message: "Consumer profile already exists",
      status: 409,
    })
  })

  it("creates consumer profile", async () => {
    mocks.consumerFindUnique.mockResolvedValue(null)
    mocks.consumerCreate.mockResolvedValue({ id: "c-1", user_id: "user-1", type: "INDIVIDUAL" })

    const result = await createConsumer("user-1", "INDIVIDUAL")
    expect(mocks.consumerCreate).toHaveBeenCalled()
    expect(result.id).toBe("c-1")
  })
})

describe("getConsumerByUserId", () => {
  it("throws when consumer not found", async () => {
    mocks.consumerFindUnique.mockResolvedValue(null)
    await expect(getConsumerByUserId("user-1")).rejects.toMatchObject({
      message: "Consumer profile not found",
      status: 404,
    })
  })
})
