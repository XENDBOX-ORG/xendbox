import { describe, it, expect } from "vitest"
import { validateEnv } from "./env"

describe("validateEnv", () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL
    process.env.JWT_SECRET = "x".repeat(40)
    expect(() => validateEnv()).toThrow(/DATABASE_URL/)
  })

  it("throws when JWT_SECRET is missing", () => {
    process.env.DATABASE_URL = "postgres://localhost/db"
    delete process.env.JWT_SECRET
    expect(() => validateEnv()).toThrow(/JWT_SECRET/)
  })

  it("rejects short JWT_SECRET", () => {
    process.env.DATABASE_URL = "postgres://localhost/db"
    process.env.JWT_SECRET = "short-secret"
    expect(() => validateEnv()).toThrow(/at least 32 characters/)
  })

  it("passes with valid configuration", () => {
    process.env.DATABASE_URL = "postgres://localhost/db"
    process.env.JWT_SECRET = "x".repeat(40)
    expect(() => validateEnv()).not.toThrow()
  })
})