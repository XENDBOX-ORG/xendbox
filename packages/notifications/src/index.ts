export { sendEmail } from './sender'
export type { SendEmailParams, SendResult } from './sender'
export {
  renderWaitlistConfirmation,
  renderWelcomeEmail,
  renderDeliveryUpdate,
  renderAccountNotification,
  renderOnboardingEmail,
} from './templates'
export { renderEmailTemplate } from './templates/base'
