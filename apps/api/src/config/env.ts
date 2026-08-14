const REQUIRED = {
  DATABASE_URL: "Prisma database connection string",
  JWT_SECRET: "JWT signing secret (at least 32 characters)",
}

const OPTIONAL_SHAPE: Record<string, (v: string) => boolean> = {
  PAYSTACK_SECRET_KEY: (v) => v.length > 0,
  RESEND_API_KEY: (v) => v.length > 0,
  PORT: (v) => /^\d+$/.test(v),
}

export function validateEnv(): void {
  const missing: string[] = []
  const invalid: string[] = []

  for (const [name, desc] of Object.entries(REQUIRED)) {
    const value = process.env[name]
    if (!value) {
      missing.push(`${name} (${desc})`)
      continue
    }
    if (name === "JWT_SECRET" && value.length < 32) {
      invalid.push(`JWT_SECRET must be at least 32 characters (got ${value.length})`)
    }
  }

  for (const [name, check] of Object.entries(OPTIONAL_SHAPE)) {
    const value = process.env[name]
    if (value && !check(value)) {
      invalid.push(`${name} has invalid value`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join("\n  - ")}\n` +
        `See .env.example for reference.`
    )
  }

  if (invalid.length > 0) {
    throw new Error(`Invalid environment configuration:\n  - ${invalid.join("\n  - ")}`)
  }
}