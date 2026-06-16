import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
}

export interface SendResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  const from = params.from || process.env.FROM_EMAIL || 'Zendbox <onboarding@resend.dev>'

  try {
    const client = getResend()
    const { data, error } = await client.emails.send({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Sent: "${params.subject}" to ${Array.isArray(params.to) ? params.to.join(', ') : params.to} (id: ${data?.id})`)
    return { success: true, id: data?.id }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Email] Send error:', message)
    return { success: false, error: message }
  }
}
