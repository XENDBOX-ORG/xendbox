import { Hono } from 'hono'
import {
  sendEmail,
  renderWaitlistConfirmation,
} from '@xendbox/notifications'

const email = new Hono()

email.post('/waitlist/confirm', async (c) => {
  const { email: to, name } = await c.req.json()
  if (!to) return c.json({ error: 'Email is required' }, 400)

  const { html, text } = renderWaitlistConfirmation({ email: to, name })
  const result = await sendEmail({
    to,
    subject: 'You\u2019re on the Waitlist!',
    html,
    text,
  })

  return c.json(result, result.success ? 200 : 500)
})

export default email
