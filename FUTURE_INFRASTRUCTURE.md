# Future Infrastructure

## Redis GEO

### Why

The current dispatch engine uses Haversine distance to filter nearby riders. This is calculated in-application and does not scale — every dispatch triggers a full table scan of online riders, computing distance against each one.

### Solution

Replace the Haversine filter with Redis GEO commands for O(log N) radius queries.

### Implementation

```typescript
// On rider location update (Phase 7 tracking)
await redis.geoadd("riders:online", longitude, latitude, riderId)

// On dispatch (Phase 5 dispatch engine)
const nearby = await redis.georadius(
  "riders:online",
  pickupLng, pickupLat,
  radiusKm, "km"
)

// On rider goes offline/busy
await redis.zrem("riders:online", riderId)
```

### Migration

1. Add `ioredis` package to `packages/database` or `packages/redis`
2. Create `packages/redis/src/index.ts` with a Redis client singleton
3. Update `POST /api/tracking/location` to sync location to Redis GEO
4. Update `startDispatch` in dispatch service to query Redis GEO instead of `riderAvailability`
5. Keep `rider_location_history` and `rider_availability` as the source of truth

---

## BullMQ (Background Jobs)

### Why

Several flows require deferred or scheduled execution that cannot be handled synchronously:

| Job | Why Async |
|---|---|
| Dispatch timeout | Riders must respond within N seconds; auto-decline + re-dispatch on timeout |
| Order expiry | Unpaid orders should be auto-cancelled after a timeout |
| Push notifications | FCM (Firebase Cloud Messaging) calls are external and should not block the response |
| SMS/Email alerts | OTP delivery, delivery confirmations via Resend |
| Wallet settlements | Batch settlement processing for logistics companies |
| Analytics aggregation | Daily materialized view refresh |

### Implementation

```typescript
// Queue definitions
const dispatchQueue = new Queue("dispatch")
const notificationQueue = new Queue("notifications")
const settlementQueue = new Queue("settlements")
const analyticsQueue = new Queue("analytics")

// Example: dispatch timeout
await dispatchQueue.add(
  "dispatch-timeout",
  { dispatchId, orderId },
  { delay: 60_000 } // 60 seconds from now
)

// Worker
const worker = new Worker("dispatch", async (job) => {
  switch (job.name) {
    case "dispatch-timeout":
      return handleDispatchTimeout(job.data)
  }
})
```

### Flow: Dispatch Timeout

```
1. POST /api/dispatch/orders/:id/start
   → Creates Dispatch + DispatchAttempts
   → Enqueues "dispatch-timeout" job (delay: 60s)

2. If rider accepts within 60s:
   → Cancel the timeout job (job.remove())

3. If 60s elapses:
   → BullMQ worker triggers handleDispatchTimeout()
   → Marks all PENDING attempts as TIMEOUT
   → Checks if any rider accepted
   → If no one accepted: marks Dispatch as EXPIRED
     → Optionally re-dispatches with wider radius
```

### Setup

1. `npm install bullmq ioredis`
2. Create `apps/api/src/jobs/` directory
3. Create queue definitions per domain
4. Create worker files that run in a separate process
5. Update `package.json` scripts:

```json
{
  "scripts": {
    "dev:worker": "tsx watch src/workers/index.ts",
    "dev:api": "tsx watch src/index.ts"
  }
}
```
