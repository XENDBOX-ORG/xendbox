import { prisma } from "@xendbox/database"
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  generateOtpCode,
  getOtpExpiry,
  getRefreshExpiry,
} from "@xendbox/auth"
import type { AuthTokens } from "@xendbox/types"
import { AppError } from "../../shared/errors"

export async function registerUser(data: {
  email?: string
  phone?: string
  password: string
  first_name: string
  last_name: string
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email || undefined },
        { phone: data.phone || undefined },
      ].filter(Boolean),
    },
  })

  if (existing) {
    throw new AppError("Email or phone already registered", 409)
  }

  const password_hash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
    },
  })

  await sendOtp(data.email || data.phone!, data.email ? "email" : "phone")

  return { id: user.id, email: user.email, phone: user.phone }
}

export async function loginUser(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
    },
  })

  if (!user || !user.password_hash) {
    throw new AppError("Invalid credentials", 401)
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    throw new AppError("Invalid credentials", 401)
  }

  const tokens = generateTokens({ sub: user.id, email: user.email ?? undefined, phone: user.phone ?? undefined })

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: tokens.refresh_token,
      expires_at: getRefreshExpiry(),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    tokens,
  }
}

export async function refreshTokens(token: string): Promise<{ tokens: AuthTokens; user_id: string }> {
  const stored = await prisma.refreshToken.findUnique({ where: { token } })

  if (!stored || stored.expires_at < new Date()) {
    throw new AppError("Invalid or expired refresh token", 401)
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } })

  const user = await prisma.user.findUnique({ where: { id: stored.user_id } })
  if (!user) throw new AppError("User not found", 404)

  const tokens = generateTokens({ sub: user.id, email: user.email ?? undefined, phone: user.phone ?? undefined })

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: tokens.refresh_token,
      expires_at: getRefreshExpiry(),
    },
  })

  return { tokens, user_id: user.id }
}

export async function sendOtp(identifier: string, channel: "email" | "phone") {
  const code = generateOtpCode()

  await prisma.otpCode.create({
    data: {
      identifier,
      code,
      purpose: "VERIFY_IDENTITY",
      expires_at: getOtpExpiry(),
    },
  })

  // TODO: Send via email/SMS provider
  console.log(`[OTP] ${channel} → ${identifier}: ${code}`)

  return { message: "OTP sent" }
}

export async function verifyOtp(identifier: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: {
      identifier,
      code,
      purpose: "VERIFY_IDENTITY",
      used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  })

  if (!otp) {
    throw new AppError("Invalid or expired OTP", 400)
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  })

  await prisma.user.updateMany({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
    },
    data: { is_verified: true },
  })

  return { message: "OTP verified" }
}
