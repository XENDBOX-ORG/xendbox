import type { Context } from "hono"
import { AppError } from "./errors"

export function getParam(c: Context, key: string): string {
  const value = c.req.param(key)
  if (value === undefined || value === "") {
    throw new AppError(`Missing path parameter: ${key}`, 400)
  }
  return value
}

export function getQuery(c: Context, key: string): string | undefined {
  return c.req.query(key)
}