import { Hono } from "hono"
import {
  sendEmail,
  renderWaitlistConfirmation,
} from "@xendbox/notifications"
import { parseBody } from "../shared/validate"
import { waitlistConfirmSchema } from "@xendbox/validation"
import { AppError } from "../shared/errors"

const email = new Hono()

email.post("/waitlist/confirm", async (c) => {
  try {
    const { email: to, name } = await parseBody(c, waitlistConfirmSchema)

    const { html, text } = renderWaitlistConfirmation({ email: to, name })
    const result = await sendEmail({
      to,
      subject: "You\u2019re on the Waitlist!",
      html,
      text,
    })

    return c.json(result, result.success ? 200 : 500)
  } catch (e) {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)
    throw e
  }
})

export default email