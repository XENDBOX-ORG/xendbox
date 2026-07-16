import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import type { JwtPayload, AuthTokens } from "@xendbox/types"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"
const JWT_EXPIRES_IN = "15m"
const REFRESH_EXPIRES_IN = "7d"
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000
const BCRYPT_ROUNDS = 12
const OTP_LENGTH = 6
const OTP_EXPIRES_MS = 10 * 60 * 1000

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex")
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function generateTokens(payload: JwtPayload): AuthTokens {
  return {
    access_token: generateAccessToken(payload),
    refresh_token: generateRefreshToken(),
  }
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRES_MS)
}

export function getRefreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_EXPIRES_MS)
}

export { REFRESH_EXPIRES_MS, OTP_EXPIRES_MS }
