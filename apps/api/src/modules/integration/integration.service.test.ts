import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  orgFindUnique: vi.fn(),
  keyCreate: vi.fn(),
  keyFindMany: vi.fn(),
  keyUpdateMany: vi.fn(),
  keyFindUnique: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    organization: { findUnique: (...a: unknown[]) => mocks.orgFindUnique(...a) },
    apiKey: {
      create: (...a: unknown[]) => mocks.keyCreate(...a),
      findMany: (...a: unknown[]) => mocks.keyFindMany(...a),
      updateMany: (...a: unknown[]) => mocks.keyUpdateMany(...a),
      findUnique: (...a: unknown[]) => mocks.keyFindUnique(...a),
    },
  },
}))

import { createApiKey, listApiKeys, revokeApiKey, authenticateApiKey, hashKey } from "./integration.service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createApiKey", () => {
  it("returns the plaintext key only once", async () => {
    mocks.orgFindUnique.mockResolvedValue({ id: "org-1" })
    mocks.keyCreate.mockResolvedValue({})

    const result = await createApiKey("org-1", { name: "prod" })

    expect(result.key).toMatch(/^xnd_/)
    expect(result.prefix).toBe(result.key.slice(0, 10))
    expect(result.key).not.toBe(result.prefix)
    expect(mocks.keyCreate.mock.calls[0][0].data.key_hash).not.toBe(result.key)
  })

  it("throws 404 for a missing organization", async () => {
    mocks.orgFindUnique.mockResolvedValue(null)
    await expect(createApiKey("org-99", { name: "x" })).rejects.toBeInstanceOf(AppError)
  })
})

describe("revokeApiKey", () => {
  it("soft-deletes a key scoped to the org", async () => {
    mocks.keyUpdateMany.mockResolvedValue({ count: 1 })
    const result = await revokeApiKey("org-1", "key-1")
    expect(mocks.keyUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "key-1", organization_id: "org-1" } })
    )
    expect(result.message).toContain("revoked")
  })

  it("throws 404 when the key is not in the org", async () => {
    mocks.keyUpdateMany.mockResolvedValue({ count: 0 })
    await expect(revokeApiKey("org-1", "key-99")).rejects.toBeInstanceOf(AppError)
  })
})

describe("authenticateApiKey", () => {
  it("returns null for an unknown key", async () => {
    mocks.keyFindUnique.mockResolvedValue(null)
    const result = await authenticateApiKey("xnd_unknown")
    expect(result).toBeNull()
  })

  it("returns null for a revoked key", async () => {
    mocks.keyFindUnique.mockResolvedValue({ revoked_at: new Date() })
    const result = await authenticateApiKey("xnd_revoked")
    expect(result).toBeNull()
  })

  it("returns null for an expired key", async () => {
    mocks.keyFindUnique.mockResolvedValue({
      revoked_at: null,
      expires_at: new Date(Date.now() - 1000),
    })
    const result = await authenticateApiKey("xnd_expired")
    expect(result).toBeNull()
  })

  it("hashes lookups so plaintext keys are never stored", async () => {
    const key = "xnd_secretvalue"
    mocks.keyFindUnique.mockResolvedValue({ revoked_at: null, expires_at: null })
    await authenticateApiKey(key)
    expect(mocks.keyFindUnique.mock.calls[0][0].where.key_hash).toBe(hashKey(key))
  })
})