import { Queue } from "bullmq"
import { isRedisAvailable, getRedisClient } from "@xendbox/redis"
import { prisma } from "@xendbox/database"

const DISPATCH_TIMEOUT_MS = 60_000
const ORDER_EXPIRY_MS = 24 * 60 * 60 * 1000

let dispatchQueue: Queue | null = null
let orderQueue: Queue | null = null

function connection() {
  const client = getRedisClient()
  return client ?? { host: "localhost", port: 6379 }
}

function getDispatchQueue(): Queue | null {
  if (!isRedisAvailable()) return null
  if (!dispatchQueue) dispatchQueue = new Queue("dispatch", { connection: connection() })
  return dispatchQueue
}

function getOrderQueue(): Queue | null {
  if (!isRedisAvailable()) return null
  if (!orderQueue) orderQueue = new Queue("orders", { connection: connection() })
  return orderQueue
}

export async function enqueueDispatchTimeout(dispatchId: string): Promise<string | null> {
  const queue = getDispatchQueue()
  if (queue) {
    await queue.add(
      "dispatch.timeout",
      { dispatchId },
      { delay: DISPATCH_TIMEOUT_MS, jobId: `dispatch:${dispatchId}` }
    )
    return `dispatch:${dispatchId}`
  }
  return scheduleInProcessDispatchTimeout(dispatchId)
}

const inProcessTimers = new Map<string, NodeJS.Timeout>()

function scheduleInProcessDispatchTimeout(dispatchId: string): string {
  const timer = setTimeout(async () => {
    inProcessTimers.delete(dispatchId)
    await expireDispatch(dispatchId)
  }, DISPATCH_TIMEOUT_MS)
  inProcessTimers.set(dispatchId, timer)
  return `local:${dispatchId}`
}

export async function cancelDispatchTimeout(dispatchId: string | null): Promise<void> {
  if (!dispatchId) return

  const timer = inProcessTimers.get(dispatchId)
  if (timer) {
    clearTimeout(timer)
    inProcessTimers.delete(dispatchId)
    return
  }

  const queue = getDispatchQueue()
  if (queue) {
    try {
      await queue.remove(`dispatch:${dispatchId}`)
    } catch {
      /* job may have already run */
    }
  }
}

async function expireDispatch(dispatchId: string) {
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      select: { status: true, order_id: true },
    })
    if (!dispatch || dispatch.status !== "SEARCHING") return

    await prisma.$transaction([
      prisma.dispatch.update({
        where: { id: dispatchId },
        data: { status: "EXPIRED" },
      }),
      prisma.dispatchAttempt.updateMany({
        where: { dispatch_id: dispatchId, status: "PENDING" },
        data: { status: "TIMEOUT" },
      }),
      prisma.order.update({
        where: { id: dispatch.order_id },
        data: {
          status: "PAID",
          events: {
            create: {
              event_type: "DISPATCH_EXPIRED",
              metadata: { dispatch_id: dispatchId },
            },
          },
        },
      }),
    ])
  } catch (err) {
    console.error("[job] dispatch timeout failed:", err)
  }
}

export async function enqueueOrderExpiry(orderId: string): Promise<string | null> {
  const queue = getOrderQueue()
  if (queue) {
    await queue.add(
      "orders.expire_unpaid",
      { orderId },
      { delay: ORDER_EXPIRY_MS, jobId: `order:${orderId}` }
    )
    return `order:${orderId}`
  }
  return scheduleInProcessOrderExpiry(orderId)
}

const orderExpiryTimers = new Map<string, NodeJS.Timeout>()

function scheduleInProcessOrderExpiry(orderId: string): string {
  const timer = setTimeout(async () => {
    orderExpiryTimers.delete(orderId)
    await expireUnpaidOrder(orderId)
  }, ORDER_EXPIRY_MS)
  orderExpiryTimers.set(orderId, timer)
  return `local:${orderId}`
}

export async function cancelOrderExpiry(orderId: string | null): Promise<void> {
  if (!orderId) return

  const timer = orderExpiryTimers.get(orderId)
  if (timer) {
    clearTimeout(timer)
    orderExpiryTimers.delete(orderId)
    return
  }

  const queue = getOrderQueue()
  if (queue) {
    try {
      await queue.remove(`order:${orderId}`)
    } catch {
      /* job may have already run */
    }
  }
}

async function expireUnpaidOrder(orderId: string) {
  try {
    const updated = await prisma.order.updateMany({
      where: { id: orderId, payment_status: "PENDING", status: { in: ["CREATED", "PAYMENT_PENDING"] } },
      data: {
        status: "CANCELLED",
        events: {
          create: {
            event_type: "ORDER_AUTO_CANCELLED",
            metadata: { reason: "Unpaid for 24 hours" },
          },
        },
      },
    })
    if (updated.count === 0) return
  } catch (err) {
    console.error("[job] order expiry failed:", err)
  }
}

export async function startJobWorkers(): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn("[jobs] Redis unavailable; using in-process fallback timers")
    return
  }

  const { Worker } = await import("bullmq")

  new Worker(
    "dispatch",
    async (job) => {
      if (job.name === "dispatch.timeout") {
        await expireDispatch(job.data.dispatchId)
      }
    },
    { connection: connection() }
  )

  new Worker(
    "orders",
    async (job) => {
      if (job.name === "orders.expire_unpaid") {
        await expireUnpaidOrder(job.data.orderId)
      }
    },
    { connection: connection() }
  )

  console.log("[jobs] BullMQ workers started")
}

export { DISPATCH_TIMEOUT_MS, ORDER_EXPIRY_MS }