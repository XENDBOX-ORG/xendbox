import { Redis } from "ioredis"

let client: Redis | null = null
let available: boolean | null = null

const configured = (): boolean => {
  const url = process.env.REDIS_URL
  return !!url && url !== "redis://localhost:6379"
}

export function getRedisClient(): Redis | null {
  if (available === false || !configured()) return null
  if (client) return client

  try {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    })
    client.on("error", () => {
      available = false
    })
    available = true
    return client
  } catch {
    available = false
    return null
  }
}

export function isRedisAvailable(): boolean {
  return getRedisClient() !== null
}

export async function pingRedis(): Promise<boolean> {
  const c = getRedisClient()
  if (!c) return false
  try {
    const res = await c.ping()
    return res === "PONG"
  } catch {
    available = false
    return false
  }
}