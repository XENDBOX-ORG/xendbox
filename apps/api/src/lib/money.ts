/**
 * Money representation.
 *
 * All money inside the Xendbox ledger is stored as integer KOBO (British-Nigerian
 * penny) figures using BigInt. JavaScript floats are ONLY used at the API boundary
 * (naira input/output) and are converted here with rounding to two decimal places.
 *
 * Never perform money arithmetic with `number`/`float` beyond the /100 boundary
 * conversions in this module.
 */

export type Kobo = bigint

const KOBO_PER_NAIRA = 100n

/** Naira (number or 2dp string) -> integer kobo. Rejects non-finite and negative values. */
export function toKobo(naira: number | string): Kobo {
  const value = typeof naira === "string" ? parseNaira(naira) : naira
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid monetary value: ${String(naira)}`)
  }
  const kobo = Math.round(value * 100)
  if (kobo < 0) throw new Error(`Invalid monetary value: ${String(naira)}`)
  return BigInt(kobo)
}

/** integer kobo -> naira number (display only, lossy beyond cents). */
export function koboToNaira(kobo: Kobo | number | bigint): number {
  const value = typeof kobo === "bigint" ? kobo : BigInt(kobo)
  return Number(value) / 100
}

/** integer kobo -> "1234.56" naira string, always two decimal places. */
export function koboToNairaString(kobo: Kobo | number | bigint): string {
  const value = typeof kobo === "bigint" ? kobo : BigInt(kobo)
  const sign = value < 0n ? "-" : ""
  const abs = value < 0n ? -value : value
  const whole = abs / KOBO_PER_NAIRA
  const frac = abs % KOBO_PER_NAIRA
  return `${sign}${whole}.${frac.toString().padStart(2, "0")}`
}

/** Serialization helper for API responses: kobo -> naira number. */
export function toNairaNumber(kobo: Kobo | number | bigint): number {
  return koboToNaira(kobo)
}

function parseNaira(naira: string): number {
  const trimmed = naira.trim()
  if (!/^\d+(?:\.\d{0,2})?$/.test(trimmed)) {
    throw new Error(`Invalid monetary value: ${naira}`)
  }
  return Number(trimmed)
}

/** Safe integer percent split: `base * percent / 100` without float drift. */
export function splitKobo(base: Kobo, percent: number): Kobo {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error(`Invalid percentage: ${percent}`)
  }
  return (base * BigInt(percent)) / 100n
}