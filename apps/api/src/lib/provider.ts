/**
 * Financial provider abstraction.
 *
 * The core financial domain depends ONLY on this interface. Monnify is the
 * approved provider implementation; keeping it behind this seam means the
 * ledger never imports Monnify-specific code directly.
 */

export interface VirtualAccountRequest {
  accountReference: string
  accountName: string
  customerEmail?: string
}

export interface VirtualAccountResult {
  accountReference: string
  accountNumber: string
  accountName: string
  bankName?: string
  bankCode?: string
  status: string
}

export interface TransactionVerificationRequest {
  paymentReference?: string
  transactionReference?: string
}

export interface VerifiedTransaction {
  transactionReference: string
  paymentReference?: string
  /** Amount actually paid, in kobo. */
  amountKobo: bigint
  currency: string
  /** Provider collection status, e.g. "SUCCESSFUL". */
  status: string
  settlementStatus?: string
  paymentMethod?: string
  paidOn?: string
  accountNumber?: string
  bankName?: string
}

export interface NameEnquiryRequest {
  bankCode: string
  accountNumber: string
}

export interface NameEnquiryResult {
  accountName: string
  accountNumber: string
  bankCode: string
}

export interface PayoutRequest {
  /** Idempotency key: must be unique per payout. */
  transactionReference: string
  amountKobo: bigint
  destinationBankCode: string
  destinationAccountNumber: string
  narration?: string
  /**
   * Xendbox's own collection/settlement account with the provider. Optional:
   * the provider implementation knows its own wallet account from configuration.
   */
  sourceAccountNumber?: string
}

export interface PayoutResult {
  transactionReference: string
  status: string
  providerMessage?: string
}

export interface PayoutVerificationRequest {
  paymentReference?: string
  transactionReference?: string
}

export interface FinancialProvider {
  readonly name: string
  createVirtualAccount(request: VirtualAccountRequest): Promise<VirtualAccountResult>
  verifyTransaction(request: TransactionVerificationRequest): Promise<VerifiedTransaction>
  nameEnquiry(request: NameEnquiryRequest): Promise<NameEnquiryResult>
  initiatePayout(request: PayoutRequest): Promise<PayoutResult>
  verifyPayout(request: PayoutVerificationRequest): Promise<VerifiedTransaction>
  verifyWebhookSignature(signature: string, body: string): boolean
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = "ProviderError"
  }
}
