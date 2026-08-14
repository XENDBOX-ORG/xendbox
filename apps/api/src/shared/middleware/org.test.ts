import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  memberFindUnique: vi.fn(),
  stationFindUnique: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    organizationMember: {
      findUnique: (...a: unknown[]) => mocks.memberFindUnique(...a),
    },
    pickupStation: {
      findUnique: (...a: unknown[]) => mocks.stationFindUnique(...a),
    },
  },
}))

import { requireOrgMember, requireOrgRole, assertOrgAccess } from "./org"

function mockContext(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = { user: { sub: "user-1" } }
  return {
    get: vi.fn((key: string) => values[key]),
    req: {
      param: vi.fn((name: string) => (name === "orgId" || name === "id" ? "org-1" : undefined)),
      query: vi.fn(() => ({})),
    },
    set: vi.fn((key: string, value: unknown) => {
      values[key] = value
    }),
    upgradeGet: (key: string, value: unknown) => {
      values[key] = value
    },
    ...overrides,
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("requireOrgMember", () => {
  it("rejects non-member (403)", async () => {
    mocks.memberFindUnique.mockResolvedValue(null)
    const next = vi.fn()
    await expect(requireOrgMember(mockContext(), next)).rejects.toMatchObject({
      message: "You do not have access to this organization",
      status: 403,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects a suspended member", async () => {
    mocks.memberFindUnique.mockResolvedValue({ status: "SUSPENDED", role: "OWNER" })
    const next = vi.fn()
    await expect(requireOrgMember(mockContext(), next)).rejects.toBeInstanceOf(AppError)
  })

  it("allows an ACTIVE member and sets orgMember on context", async () => {
    mocks.memberFindUnique.mockResolvedValue({ status: "ACTIVE", role: "STAFF" })
    const next = vi.fn()
    const c: any = mockContext()
    await requireOrgMember(c, next)
    expect(c.set).toHaveBeenCalledWith("orgMember", expect.objectContaining({ role: "STAFF" }))
    expect(next).toHaveBeenCalled()
  })
})

describe("requireOrgRole", () => {
  it("rejects a member whose role is not allowed", async () => {
    const c: any = mockContext()
    c.upgradeGet("orgMember", { role: "STAFF", status: "ACTIVE" })
    const next = vi.fn()
    await expect(requireOrgRole("OWNER")(c, next)).rejects.toMatchObject({
      message: "You do not have permission to perform this action",
    })
  })

  it("allows a member with the required role", async () => {
    const c: any = mockContext()
    c.upgradeGet("orgMember", { role: "OWNER", status: "ACTIVE" })
    const next = vi.fn()
    await requireOrgRole("OWNER")(c, next)
    expect(next).toHaveBeenCalled()
  })
})