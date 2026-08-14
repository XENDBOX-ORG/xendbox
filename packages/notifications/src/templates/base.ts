const baseStyle = `
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
  background-color: #0f0f1a;
  color: #e5e5e5;
`

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 24px;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  border-radius: 16px;
`

const headerStyle = `
  text-align: center;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255, 90, 31, 0.2);
  margin-bottom: 32px;
`

const logoStyle = `
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  text-decoration: none;
`

const logoBoxStyle = `
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #FF5A1F, #e04e1a);
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

const buttonStyle = `
  display: inline-block;
  padding: 14px 36px;
  background: linear-gradient(135deg, #FF5A1F, #e04e1a);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  border-radius: 12px;
  margin: 24px 0;
  box-shadow: 0 4px 24px rgba(255, 90, 31, 0.3);
`

const footerStyle = `
  text-align: center;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 32px;
  font-size: 13px;
  color: #6b7280;
`

interface TemplateProps {
  title: string
  preview: string
  body: string
  button?: { text: string; url: string }
  recipientName?: string
  extraContent?: string
}

export function renderEmailTemplate(props: TemplateProps): { html: string; text: string } {
  const { title, body, button, recipientName, extraContent } = props

  const greeting = recipientName
    ? `Hi ${recipientName},`
    : 'Hey there,'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${title}</title>
  <style>
    @media (max-width: 480px) {
      .container { padding: 24px 16px !important; }
      .logo-text { font-size: 20px !important; }
      .button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="${baseStyle}">
  <div class="container" style="${containerStyle}">
    <!-- Header -->
    <div style="${headerStyle}">
      <a href="https://xendbox-88183.web.app" style="${logoStyle}">
        <span style="${logoBoxStyle}">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M8 16L14 22L24 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="logo-text" style="font-size: 22px;">Xendbox</span>
      </a>
    </div>

    <!-- Body -->
    <div style="text-align: left;">
      <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 8px;">${title}</h1>
      <p style="font-size: 15px; color: #9ca3af; margin: 0 0 20px; line-height: 1.6;">
        ${greeting}
      </p>
      <div style="font-size: 15px; color: #d1d5db; line-height: 1.7;">
        ${body}
      </div>
      ${button ? `<div style="text-align: center;">
        <a class="button" href="${button.url}" style="${buttonStyle}">${button.text}</a>
      </div>` : ''}
      ${extraContent ? `<div style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 16px;">${extraContent}</div>` : ''}
    </div>

    <!-- Footer -->
    <div style="${footerStyle}">
      <p style="margin: 0 0 4px;">&copy; ${new Date().getFullYear()} Xendbox Africa. All rights reserved.</p>
      <p style="margin: 0;">Lagos, Nigeria &bull; AI-Native Delivery Infrastructure for Africa</p>
      <p style="margin: 8px 0 0; font-size: 12px;">
        You received this because you signed up for Xendbox.
      </p>
    </div>
  </div>
</body>
</html>`

  const text = `${title}\n\n${greeting}\n\n${body.replace(/<[^>]*>/g, '')}${button ? `\n\n${button.text}: ${button.url}` : ''}\n\n\u2014 Xendbox Team`

  return { html, text }
}
