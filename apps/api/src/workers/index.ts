import { Worker } from "bullmq"
import { isRedisAvailable, getRedisClient } from "@xendbox/redis"
import { expireDispatch, expireUnpaidOrder } from "../jobs"

function connection() {
  const client = getRedisClient()
  return client ?? { host: "localhost", port: 6379 }
}

export async function startWorkers(): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn("[workers] Redis unavailable; workers disabled")
    return
  }

  const dispatchWorker = new Worker(
    "dispatch",
    async (job) => {
      if (job.name === "dispatch.timeout") {
        await expireDispatch(job.data.dispatchId)
      }
    },
    { connection: connection() }
  )

  const orderWorker = new Worker(
    "orders",
    async (job) => {
      if (job.name === "orders.expire_unpaid") {
        await expireUnpaidOrder(job.data.orderId)
      }
    },
    { connection: connection() }
  )

  dispatchWorker.on("error", (err) => console.error("[dispatch worker] error:", err))
  orderWorker.on("error", (err) => console.error("[order worker] error:", err))

  console.log("[workers] BullMQ workers started")
}
