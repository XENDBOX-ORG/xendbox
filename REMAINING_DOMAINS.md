# Remaining ERD Domains — Not Yet Implemented

These are the domains from the ERD v3 that have not been built yet, listed by priority.

---

## 1. Ratings Domain

### Rider Ratings

```sql
RIDER_RATINGS
id PK
rider_id FK
consumer_id FK
order_id FK
rating
comment
```

### Station Ratings

```sql
STATION_RATINGS
id PK
station_id FK
rating
comment
```

### Key Notes

- One rating per order per rider (unique constraint on `[rider_id, order_id]`)
- Rating is 1-5
- Aggregated into `Rider.rating` (average)
- Station ratings are separate from rider ratings

### API Endpoints

```
POST /api/ratings/rider          — Rate a rider after delivery (auth, consumer)
GET  /api/ratings/rider/:id      — Get rider's ratings (auth)
POST /api/ratings/station        — Rate a pickup station (auth, consumer)
GET  /api/ratings/station/:id    — Get station's ratings (auth)
```

---

## 2. Notification Domain

```sql
NOTIFICATIONS
id PK
user_id FK
title
message
type
read_at
created_at
```

### Types

- ORDER_UPDATE — status changes
- DISPATCH_ALERT — new dispatch attempt
- PAYMENT_CONFIRMATION
- DELIVERY_CONFIRMATION
- PICKUP_CODE_READY
- SYSTEM

### API Endpoints

```
GET    /api/notifications              — List my notifications (auth)
PATCH  /api/notifications/:id/read     — Mark as read (auth)
POST   /api/notifications/read-all     — Mark all as read (auth)
```

### Push Notifications

- Firebase Cloud Messaging (FCM) integration is planned
- Device tokens stored during auth (Phase 1 has `devices` in the system design, not in ERD)
- FCM service layer in `packages/notifications`

---

## 3. Audit Domain

```sql
AUDIT_LOGS
id PK
actor_id FK
action
entity
entity_id
metadata
created_at
```

### Key Notes

- Middleware-based — logs are created by middleware, not manually
- Covers all state-changing operations: CREATE, UPDATE, DELETE
- `entity` is the table/model name, `entity_id` is the record ID
- Metadata captures before/after state, IP, user-agent

### Implementation Approach

```typescript
// Middleware
app.use("*", async (c, next) => {
  await next()
  if (c.req.method !== "GET") {
    await prisma.auditLog.create({
      data: {
        actor_id: c.get("user")?.sub,
        action: `${c.req.method} ${c.req.path}`,
        entity: extractEntity(c.req.path),
        entity_id: c.req.param("id"),
        metadata: { status: c.res.status },
      },
    })
  }
})
```

### API Endpoints (admin only)

```
GET /api/admin/audit-logs              — List audit logs (auth, admin)
GET /api/admin/audit-logs?entity=Order — Filter by entity (auth, admin)
GET /api/admin/audit-logs/:id          — Get log detail (auth, admin)
```

---

## 4. Integration Domain (API Keys + Webhooks)

For logistics companies to integrate with Xendbox programmatically.

### API Keys

```sql
API_KEYS
id PK
organization_id FK
key_hash
permissions
created_at
```

- Key is generated as a random token, only shown once at creation
- `key_hash` stores a SHA-256 hash (never the raw key)
- `permissions` is a JSON array of allowed scopes
- Authenticated via `Authorization: Bearer xnd_...` header

### Webhooks

```sql
WEBHOOKS
id PK
organization_id FK
url
events
```

- `events` is a JSON array of event types to subscribe to
- Events: `order.created`, `order.delivered`, `rider.assigned`, `payment.confirmed`
- Payload sent as POST to the webhook URL with HMAC signature header
- Retry logic (3 attempts with exponential backoff)

### API Endpoints

```
POST   /api/integration/api-keys              — Generate API key (auth, org owner)
GET    /api/integration/api-keys               — List API keys (auth, org owner)
DELETE /api/integration/api-keys/:id           — Revoke API key (auth, org owner)

POST   /api/integration/webhooks               — Register webhook (auth, org owner)
GET    /api/integration/webhooks                — List webhooks (auth, org owner)
PATCH  /api/integration/webhooks/:id            — Update webhook (auth, org owner)
DELETE /api/integration/webhooks/:id            — Delete webhook (auth, org owner)
```

---

## 5. PUDO Full Lifecycle Gaps

The current pickup station implementation covers the basic flow but is missing:

### Pickup Station Assignment on Order Creation

Currently `pickup_station_id` is on `Order` but the order creation flow does not accept or validate it for PICKUP_STATION delivery option.

Update `createOrder` in `order.service.ts` to:
- Accept optional `pickup_station_id`
- If `delivery_option.type === PICKUP_STATION`, validate the station exists and is active
- Set the field on the order

### Station Parcel Status: STORED

The ERD includes a `STORED` status between `ARRIVED` and `READY_FOR_COLLECTION`. Add a separate endpoint or step for station operators to mark parcels as stored.

### Return Flow

When a parcel is not collected within the holding period:
- Status transitions to `RETURNED`
- A reverse dispatch is created to send it back to the sender
- This requires a `return_reason` field or metadata on `StationParcel`

---

## 6. Admin Role & Dashboard

### Admin User Type

The ERD defines `ADMIN` as a user role but no admin-specific tables. Admin routes need:

- Role check middleware (`requireRole("ADMIN")`)
- User management endpoints
- Platform-wide analytics
- System configuration

### Key Admin Endpoints

```
GET    /api/admin/users              — List all users
GET    /api/admin/users/:id          — Get user details
PATCH  /api/admin/users/:id/status   — Suspend/ban user
GET    /api/admin/organizations      — List all orgs
PATCH  /api/admin/organizations/:id/verify — Verify org
GET    /api/admin/orders             — All orders
GET    /api/admin/stats              — Platform statistics
```

---

## 7. Redis Geo Migration (from FUTURE_INFRASTRUCTURE.md)

### Replace Haversine with Redis GEO

Current: `rider.service.ts → listNearbyRiders()` computes distance in-app with Haversine.
Target: `GEOADD` on location update, `GEORADIUS` on dispatch.

### Migration Steps

1. Add `ioredis` to `packages/database` (or new `packages/redis`)
2. Create Redis client singleton
3. On `POST /api/tracking/location` → `GEOADD("riders:online", lng, lat, riderId)`
4. On `startDispatch` → `GEORADIUS("riders:online", lng, lat, radius, "km")`
5. On rider goes OFFLINE/BUSY → `ZREM("riders:online", riderId)`
6. Keep PostgreSQL tables as source of truth for data integrity

---

## 8. BullMQ Background Jobs (from FUTURE_INFRASTRUCTURE.md)

### Required Workers

| Queue | Jobs | Priority |
|---|---|---|
| `dispatch` | Dispatch timeout (60s), re-dispatch on failure | High |
| `orders` | Unpaid order expiry (24h auto-cancel) | Medium |
| `notifications` | FCM push, SMS, email delivery | Medium |
| `settlements` | Weekly auto-settlement generation | Low |
| `analytics` | Daily materialized view refresh | Low |

### Implementation

```typescript
// apps/api/src/jobs/dispatch.ts
const dispatchQueue = new Queue("dispatch")

export async function enqueueDispatchTimeout(dispatchId: string, delayMs = 60_000) {
  await dispatchQueue.add("timeout", { dispatchId }, { delay: delayMs })
}

export async function cancelDispatchTimeout(jobId: string) {
  await dispatchQueue.remove(jobId)
}
```

---

## Implementation Order (Recommended)

| Order | Domain | Dependencies | Effort |
|---|---|---|---|
| 1 | PUDO gaps (pickup_station_id on order create, STORED status, return flow) | Order + PickupStation | Small |
| 2 | Ratings | Order + Rider + PickupStation | Small |
| 3 | Notifications | User | Small |
| 4 | Audit middleware | All domains | Medium |
| 5 | Admin role + scaffolding | Auth middleware | Medium |
| 6 | API Keys + Webhooks | Organization | Medium |
| 7 | Redis GEO | Tracking + Dispatch | Medium |
| 8 | BullMQ workers | Multiple domains | Large |
