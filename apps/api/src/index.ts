import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "@hono/node-server"
import { validateEnv } from "./config/env"
import { AppError } from "./shared/errors"
import { auditMiddleware } from "./shared/middleware/audit"
import auth from "./modules/identity/auth.routes"
import users from "./modules/identity/user.routes"
import organizations from "./modules/organization/organization.routes"
import consumers from "./modules/consumer/consumer.routes"
import recipients from "./modules/recipient/recipient.routes"
import orders from "./modules/order/order.routes"
import riders from "./modules/rider/rider.routes"
import vehicles from "./modules/fleet/vehicle.routes"
import dispatch from "./modules/dispatch/dispatch.routes"
import pickupStations from "./modules/pickup-station/pickup-station.routes"
import tracking from "./modules/tracking/tracking.routes"
import financial from "./modules/financial/financial.routes"
import payments from "./modules/payment/payment.routes"
import withdrawals from "./modules/withdrawal/withdrawal.routes"
import settlements from "./modules/settlement/settlement.routes"
import ratings from "./modules/rating/rating.routes"
import notifications from "./modules/notification/notification.routes"
import integration from "./modules/integration/integration.routes"
import admin from "./modules/admin/admin.routes"
import email from "./routes/email"
import { startWorkers } from "./workers"

const app = new Hono()

validateEnv()

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status)
  }
  console.error("[unhandled]", err)
  return c.json({ error: "Internal server error" }, 500)
})

app.use("/*", cors())
app.use("/*", auditMiddleware)

app.get("/", (c) => c.json({ message: "Xendbox API Running" }))

app.route("/api/auth", auth)
app.route("/api/users", users)
app.route("/api/organizations", organizations)
app.route("/api/consumers", consumers)
app.route("/api/recipients", recipients)
app.route("/api/orders", orders)
app.route("/api/riders", riders)
app.route("/api/vehicles", vehicles)
app.route("/api/dispatch", dispatch)
app.route("/api/pickup-stations", pickupStations)
app.route("/api/tracking", tracking)
app.route("/api/financial", financial)
app.route("/api/payments", payments)
app.route("/api/withdrawals", withdrawals)
app.route("/api/settlements", settlements)
app.route("/api/ratings", ratings)
app.route("/api/notifications", notifications)
app.route("/api/integrations", integration)
app.route("/api/admin", admin)
app.route("/api/email", email)

const port = parseInt(process.env.PORT || "3001")

void startWorkers()

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Xendbox API running on http://localhost:${info.port}`)
  }
)

export default app
