import { describe, it, expect } from "vitest"
import { AppError } from "./errors"

describe("AppError", () => {
  it("extends Error with status", () => {
    const err = new AppError("boom", 404)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe("boom")
    expect(err.status).toBe(404)
  })
})