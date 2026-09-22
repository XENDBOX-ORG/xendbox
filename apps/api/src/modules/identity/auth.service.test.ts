import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors"

const mocks = {
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  refreshTokenCreate: vi.fn(),
  refreshTokenFindUnique: vi.fn(),
  refreshTokenDelete: vi.fn(),
  userUpdate: vi.fn(),
  otpCodeCreate: vi.fn(),
  otpCodeFindFirst: vi.fn(),
  otpCodeUpdate: vi.fn(),
}

vi.mock("@xendbox/database", () => ({
  prisma: {
    user: {
      findFirst: (...a: unknown[]) => mocks.userFindFirst(...a),
      create: (...a: unknown[]) => mocks.userCreate(...a),
      update: (...a: unknown[]) => mocks.userUpdate(...a),
    },
    refreshToken: {
      create: (...a: unknown[]) => mocks.refreshTokenCreate(...a),
      findUnique: (...a: unknown[]) => mocks.refreshTokenFindUnique(...a),
      delete: (...a: unknown[]) => mocks.refreshTokenDelete(...a),
    },
    otpCode: {
      create: (...a: unknown[]) => mocks.otpCodeCreate(...a),
      findFirst: (...a: unknown[]) => mocks.otpCodeFindFirst(...a),
      update: (...a: unknown[]) => mocks.otpCodeUpdate(...a),
    },
  },
}))

vi.mock("@xendbox/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateTokens: vi.fn().mockReturnValue({
    access_token: "access",
    refresh_token: "refresh",
  }),
  generateRefreshToken: vi.fn().mockReturnValue("refresh"),
  verifyAccessToken: vi.fn().mockReturnValue({ sub: "user-1" }),
  generateOtpCode: vi.fn().mockReturnValue("123456"),
  getOtpExpiry: vi.fn().mockReturnValue(new Date(Date.now() + 600000)),
  getRefreshExpiry: vi.fn().mockReturnValue(new Date(Date.now() + 604800000)),
}))

import { registerUser, loginUser, refreshTokens, verifyOtp } from "./auth.service"
import { prisma } from "@xendbox/database"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("registerUser", () => {
  it("throws when user already exists", async () => {
    mocks.userFindFirst.mockResolvedValue({ id: "user-1" })
    await expect(registerUser({ email: "test@test.com", password: "password123", first_name: "Test", last_name: "User" })).rejects.toMatchObject({
      message: "Email or phone already registered",
      status: 409,
    })
  })

  it("creates user and sends OTP", async () => {
    mocks.userFindFirst.mockResolvedValue(null)
    mocks.userCreate.mockResolvedValue({ id: "user-1", email: "test@test.com", phone: null, first_name: "Test", last_name: "User" })

    const result = await registerUser({ email: "test@test.com", password: "password123", first_name: "Test", last_name: "User" })
    expect(mocks.userCreate).toHaveBeenCalled()
    expect(result.email).toBe("test@test.com")
  })
})

describe("loginUser", () => {
  it("throws when user not found", async () => {
    mocks.userFindFirst.mockResolvedValue(null)
    await expect(loginUser("test@test.com", "password")).rejects.toMatchObject({
      message: "Invalid credentials",
      status: 401,
    })
  })

  it("throws when password is wrong", async () => {
    mocks.userFindFirst.mockResolvedValue({ id: "user-1", password_hash: "$2a$12$hashedpassword", email: "test@test.com" })
    const { verifyPassword } = await import("@xendbox/auth")
    ;(verifyPassword as vi.Mock).mockResolvedValue(false)

    await expect(loginUser("test@test.com", "wrong")).rejects.toMatchObject({
      message: "Invalid credentials",
      status: 401,
    })
  })
})

describe("refreshTokens", () => {
  it("throws when refresh token not found", async () => {
    mocks.refreshTokenFindUnique.mockResolvedValue(null)
    await expect(refreshTokens("invalid")).rejects.toMatchObject({
      message: "Invalid or expired refresh token",
      status: 401,
    })
  })

  it("throws when refresh token expired", async () => {
    mocks.refreshTokenFindUnique.mockResolvedValue({ id: "rt-1", user_id: "user-1", expires_at: new Date(Date.now() - 1000) })
    await expect(refreshTokens("expired")).rejects.toMatchObject({
      message: "Invalid or expired refresh token",
      status: 401,
    })
  })
})

describe("verifyOtp", () => {
  it("throws when OTP is invalid or expired", async () => {
    mocks.otpCodeFindFirst.mockResolvedValue(null)
    await expect(verifyOtp("test@test.com", "000000")).rejects.toMatchObject({
      message: "Invalid or expired OTP",
      status: 400,
    })
  })
})
