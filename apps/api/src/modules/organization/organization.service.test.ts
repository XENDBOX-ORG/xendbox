import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  organizationCreate: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationMemberFindUnique: vi.fn(),
  organizationMemberCreate: vi.fn(),
  organizationMemberFindMany: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    organization: {
      create: (...a: unknown[]) => mocks.organizationCreate(...a),
      findUnique: (...a: unknown[]) => mocks.organizationFindUnique(...a),
    },
    organizationMember: {
      findUnique: (...a: unknown[]) => mocks.organizationMemberFindUnique(...a),
      create: (...a: unknown[]) => mocks.organizationMemberCreate(...a),
      findMany: (...a: unknown[]) => mocks.organizationMemberFindMany(...a),
    },
  },
}))

import { createOrganization, getOrganizationById, addOrganizationMember, listOrganizationMembers } from "./organization.service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createOrganization", () => {
  it("creates an organization", async () => {
    mocks.organizationCreate.mockResolvedValue({ id: "org-1", name: "Test Org" })
    const result = await createOrganization({ name: "Test Org", type: "MERCHANT", user_id: "user-1" })
    expect(result).toHaveProperty("id")
  })
})

describe("getOrganizationById", () => {
  it("throws when organization not found", async () => {
    mocks.organizationFindUnique.mockResolvedValue(null)
    await expect(getOrganizationById("org-1")).rejects.toMatchObject({ message: "Organization not found", status: 404 })
  })
})

describe("addOrganizationMember", () => {
  it("throws when user is already a member", async () => {
    mocks.organizationMemberFindUnique.mockResolvedValue({ id: "member-1" })
    await expect(addOrganizationMember({ organization_id: "org-1", user_id: "user-1", role: "RIDER" })).rejects.toMatchObject({ message: "User is already a member", status: 409 })
  })
})

describe("listOrganizationMembers", () => {
  it("returns members", async () => {
    mocks.organizationMemberFindMany.mockResolvedValue([])
    const result = await listOrganizationMembers("org-1")
    expect(result).toEqual([])
  })
})
