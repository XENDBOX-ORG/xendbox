import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  recipientCreate: vi.fn(),
  recipientFindMany: vi.fn(),
  recipientFindFirst: vi.fn(),
  recipientUpdate: vi.fn(),
  recipientDelete: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    recipient: {
      create: (...a: unknown[]) => mocks.recipientCreate(...a),
      findMany: (...a: unknown[]) => mocks.recipientFindMany(...a),
      findFirst: (...a: unknown[]) => mocks.recipientFindFirst(...a),
      update: (...a: unknown[]) => mocks.recipientUpdate(...a),
      delete: (...a: unknown[]) => mocks.recipientDelete(...a),
    },
  },
}))

import { createRecipient, listRecipients, getRecipientById, updateRecipient, deleteRecipient } from "./recipient.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createRecipient", () => {
  it("creates a recipient", async () => {
    mocks.recipientCreate.mockResolvedValue({ id: "rec-1", name: "John" })
    const result = await createRecipient("consumer-1", { name: "John", phone: "08012345678" })
    expect(mocks.recipientCreate).toHaveBeenCalled()
  })
})

describe("getRecipientById", () => {
  it("throws when recipient not found", async () => {
    mocks.recipientFindFirst.mockResolvedValue(null)
    await expect(getRecipientById("rec-1", "consumer-1")).rejects.toMatchObject({
      message: "Recipient not found",
      status: 404,
    })
  })
})

describe("updateRecipient", () => {
  it("throws when recipient not found", async () => {
    mocks.recipientFindFirst.mockResolvedValue(null)
    await expect(updateRecipient("rec-1", "consumer-1", { name: "Updated" })).rejects.toMatchObject({
      message: "Recipient not found",
      status: 404,
    })
  })
})

describe("deleteRecipient", () => {
  it("throws when recipient not found", async () => {
    mocks.recipientFindFirst.mockResolvedValue(null)
    await expect(deleteRecipient("rec-1", "consumer-1")).rejects.toMatchObject({
      message: "Recipient not found",
      status: 404,
    })
  })
})
