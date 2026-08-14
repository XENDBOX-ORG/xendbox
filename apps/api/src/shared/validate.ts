import type { Context } from "hono"
import type { ZodSchema, z } from "zod"
import { ZodError } from "zod"
import { AppError } from "./errors"

export async function parseBody<S extends ZodSchema>(c: Context, schema: S): Promise<z.infer<S>> {
  const body = await c.req.json()
  return validate(schema, body)
}

export async function parseQuery<S extends ZodSchema>(c: Context, schema: S): Promise<z.infer<S>> {
  return validate(schema, c.req.query())
}

function validate<S extends ZodSchema>(schema: S, value: unknown): z.infer<S> {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new AppError(formatZodError(parsed.error), 400)
  }
  return parsed.data
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".")
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join("; ")
}