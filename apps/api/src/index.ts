import { Hono } from "hono";
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import email from "./routes/email";

const app = new Hono();

app.use('/*', cors())

app.get("/", (c) => {
  return c.json({
    message: "Zendbox API Running"
  });
});

app.route("/api/email", email);

const port = parseInt(process.env.PORT || '3001')

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Zendbox API running on http://localhost:${info.port}`)
})

export default app;
