import { renderEmailTemplate } from './base'

export function renderWaitlistConfirmation(params: {
  email: string
  name?: string
}) {
  return renderEmailTemplate({
    title: 'You\u2019re on the Waitlist!',
    preview: 'Thanks for joining Xendbox. We\u2019ll notify you when we launch.',
    recipientName: params.name,
    body: `
      <p style="margin: 0 0 16px;">
        Thanks for joining the <strong style="color: #FF5A1F;">Xendbox</strong> waitlist!
      </p>
      <p style="margin: 0 0 16px;">
        We're building Africa's next-generation logistics infrastructure — connecting merchants, riders, warehouses, and customers through one intelligent network.
      </p>
      <p style="margin: 0 0 16px;">
        You'll be the first to know when we launch in your area. In the meantime, follow us for updates.
      </p>
    `,
    button: {
      text: 'Follow Our Journey',
      url: 'https://xendbox-88183.web.app',
    },
    extraContent: `
      <p style="margin: 0;"><strong style="color: #FF5A1F;">Email confirmed:</strong> ${params.email}</p>
    `,
  })
}

export function renderWelcomeEmail(params: {
  name: string
  role: 'merchant' | 'rider'
}) {
  const roleContent = params.role === 'merchant'
    ? `You can now create delivery orders, track shipments in real-time, and manage your entire logistics operation from one dashboard.`
    : `You're now ready to accept delivery requests, earn money on your schedule, and track your earnings in real-time.`

  return renderEmailTemplate({
    title: `Welcome to Xendbox, ${params.name}!`,
    preview: 'Your account is ready. Start delivering smarter.',
    recipientName: params.name,
    body: `
      <p style="margin: 0 0 16px;">
        Welcome aboard! Your <strong style="color: #FF5A1F;">Xendbox</strong> account is now active.
      </p>
      <p style="margin: 0 0 16px;">
        ${roleContent}
      </p>
      <p style="margin: 0 0 16px;">
        We're excited to have you as part of the Xendbox community transforming logistics across Africa.
      </p>
    `,
    button: {
      text: params.role === 'merchant' ? 'Go to Dashboard' : 'Start Accepting Orders',
      url: params.role === 'merchant'
        ? 'https://xendbox-88183.web.app/merchant'
        : 'https://xendbox-88183.web.app/rider',
    },
  })
}

export function renderDeliveryUpdate(params: {
  type: 'dispatched' | 'in_transit' | 'nearby' | 'delivered'
  orderId: string
  pickup?: string
  dropoff?: string
  eta?: string
  riderName?: string
}) {
  const subjects: Record<string, string> = {
    dispatched: 'Your package has been picked up!',
    in_transit: 'Your package is on the way!',
    nearby: 'Your rider is nearby!',
    delivered: 'Package delivered successfully!',
  }

  const bodies: Record<string, string> = {
    dispatched: `
      <p style="margin: 0 0 16px;">Your package has been picked up by your Xendbox rider and is on its way.</p>
      ${params.pickup ? `<p style="margin: 0 0 8px;"><strong>Pickup:</strong> ${params.pickup}</p>` : ''}
      ${params.dropoff ? `<p style="margin: 0 0 8px;"><strong>Dropoff:</strong> ${params.dropoff}</p>` : ''}
      ${params.eta ? `<p style="margin: 0 0 8px;"><strong>Estimated arrival:</strong> ${params.eta}</p>` : ''}
    `,
    in_transit: `
      <p style="margin: 0 0 16px;">Your package is in transit and moving toward the delivery location.</p>
      ${params.eta ? `<p style="margin: 0 0 8px;"><strong>Estimated arrival:</strong> ${params.eta}</p>` : ''}
      <p style="margin: 0 0 8px;">Track your delivery live on the Xendbox app.</p>
    `,
    nearby: `
      <p style="margin: 0 0 16px;">Your Xendbox rider is nearby and will arrive shortly!</p>
      ${params.riderName ? `<p style="margin: 0 0 8px;"><strong>Rider:</strong> ${params.riderName}</p>` : ''}
      ${params.eta ? `<p style="margin: 0 0 8px;"><strong>ETA:</strong> ${params.eta}</p>` : ''}
    `,
    delivered: `
      <p style="margin: 0 0 16px;">Your package has been <strong style="color: #10B981;">delivered successfully</strong>!</p>
      ${params.dropoff ? `<p style="margin: 0 0 8px;"><strong>Delivered to:</strong> ${params.dropoff}</p>` : ''}
      <p style="margin: 0 0 8px;">Thank you for using Xendbox. We hope you had a great delivery experience.</p>
    `,
  }

  return renderEmailTemplate({
    title: subjects[params.type],
    preview: `Delivery update for order ${params.orderId}`,
    body: `
      <div style="background: rgba(255, 90, 31, 0.08); border-left: 3px solid #FF5A1F; padding: 12px 16px; margin: 0 0 20px; border-radius: 8px;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">Order</p>
        <p style="margin: 4px 0 0; font-weight: 700; color: #ffffff; font-size: 15px;">#${params.orderId}</p>
      </div>
      ${bodies[params.type]}
    `,
    button: {
      text: 'Track Delivery',
      url: `https://xendbox-88183.web.app/track/${params.orderId}`,
    },
  })
}

export function renderAccountNotification(params: {
  type: 'password_changed' | 'email_updated' | 'account_verified'
}) {
  const subjects: Record<string, string> = {
    password_changed: 'Your password has been changed',
    email_updated: 'Your email has been updated',
    account_verified: 'Account verified successfully',
  }

  const bodies: Record<string, string> = {
    password_changed: `
      <p style="margin: 0 0 16px;">Your Xendbox account password was recently changed.</p>
      <p style="margin: 0 0 16px;">If you did not make this change, please contact our support team immediately.</p>
    `,
    email_updated: `
      <p style="margin: 0 0 16px;">Your Xendbox account email address has been updated successfully.</p>
      <p style="margin: 0 0 16px;">If you did not request this change, please contact our support team.</p>
    `,
    account_verified: `
      <p style="margin: 0 0 16px;">Your Xendbox account has been verified successfully!</p>
      <p style="margin: 0 0 16px;">You now have full access to all Xendbox features.</p>
    `,
  }

  return renderEmailTemplate({
    title: subjects[params.type],
    preview: `Account notification: ${subjects[params.type]}`,
    body: bodies[params.type],
    button: {
      text: 'Go to Account',
      url: 'https://xendbox-88183.web.app/account',
    },
  })
}

export function renderOnboardingEmail(params: {
  name: string
  role: 'merchant' | 'rider'
  step: number
}) {
  const steps: Record<string, string[]> = {
    merchant: [
      'Set up your business profile and delivery zones',
      'Add your team members and set permissions',
      'Create your first delivery order',
      'Track and manage deliveries from your dashboard',
    ],
    rider: [
      'Complete your rider profile and verification',
      'Set your availability and delivery preferences',
      'Accept your first delivery request',
      'Track your earnings and performance',
    ],
  }

  const currentStep = steps[params.role][params.step - 1] || steps[params.role][0]
  const progress = Math.round((params.step / steps[params.role].length) * 100)

  return renderEmailTemplate({
    title: `Getting Started as a ${params.role === 'merchant' ? 'Merchant' : 'Rider'}`,
    preview: `Step ${params.step}: ${currentStep}`,
    recipientName: params.name,
    body: `
      <p style="margin: 0 0 16px;">
        Great progress! Here's your next step to get the most out of Xendbox.
      </p>

      <div style="background: rgba(255, 90, 31, 0.08); border-radius: 12px; padding: 20px; margin: 0 0 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 13px; color: #9ca3af;">Onboarding Progress</span>
          <span style="font-size: 13px; font-weight: 700; color: #FF5A1F;">${progress}%</span>
        </div>
        <div style="height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; width: ${progress}%; background: linear-gradient(90deg, #FF5A1F, #e04e1a); border-radius: 3px;"></div>
        </div>
      </div>

      <p style="margin: 0 0 8px; font-weight: 700; color: #ffffff; font-size: 16px;">
        Step ${params.step}: ${currentStep}
      </p>
      <p style="margin: 0 0 16px; color: #9ca3af;">
        Complete this step to unlock the next stage of your Xendbox journey.
      </p>
    `,
    button: {
      text: 'Continue Onboarding',
      url: `https://xendbox-88183.web.app/onboarding?step=${params.step}`,
    },
  })
}
