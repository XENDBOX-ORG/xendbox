import { Hono } from "hono"
import { authMiddleware } from "../../shared/middleware/auth"
import { parseBody } from "../../shared/validate"
import { getParam } from "../../shared/params"
import { requestWithdrawalSchema } from "@xendbox/validation"
import { monnify } from "../../lib/monnify"
import { AppError } from "../../shared/errors"
import { koboToNaira } from "../../lib/money"
import {
  requestWithdrawal,
  initiateWithdrawalPayout,
  listWithdrawalsForUser,
  getWithdrawalForUser,
} from "./withdrawal.service"

const withdrawals = new Hono()

function serialize(withdrawal: {
  id: string
  amount_kobo: bigint
  status: string
  destination_bank_code: string
  destination_account_number: string
  destination_account_name: string
  destination_bank_name: string | null
  narration: string | null
  provider_reference: string | null
  failure_reason: string | null
  created_at: Date
  processed_at: Date | null
}) {
  return {
    id: withdrawal.id,
    amount: koboToNaira(withdrawal.amount_kobo),
    status: withdrawal.status,
    bank_code: withdrawal.destination_bank_code,
    account_number: withdrawal.destination_account_number,
    account_name: withdrawal.destination_account_name,
    bank_name: withdrawal.destination_bank_name,
    narration: withdrawal.narration,
    provider_reference: withdrawal.provider_reference,
    failure_reason: withdrawal.failure_reason,
    created_at: withdrawal.created_at,
    processed_at: withdrawal.processed_at,
  }
}

withdrawals.post("/", authMiddleware, async (c) => {
  const body = await parseBody(c, requestWithdrawalSchema)
  const user = c.get("user")

  const enquiry = await monnify.nameEnquiry({
    bankCode: body.bank_code,
    accountNumber: body.account_number,
  })
  if (enquiry.accountName.trim().toLowerCase() !== body.account_name.trim().toLowerCase()) {
    throw new AppError(`Name mismatch: bank account is registered to "${enquiry.accountName}"`, 400)
  }

  const withdrawal = await requestWithdrawal(user.sub, {
    amount: body.amount,
    bankCode: body.bank_code,
    accountNumber: body.account_number,
    accountName: enquiry.accountName,
    narration: body.narration,
  })

  const payout = await initiateWithdrawalPayout(withdrawal.id)
  const serialized = serialize(withdrawal)
  return c.json({ ...serialized, payout }, 201)
})

withdrawals.get("/", authMiddleware, async (c) => {
  const user = c.get("user")
  const list = await listWithdrawalsForUser(user.sub)
  return c.json(list.map(serialize))
})

withdrawals.get("/:id", authMiddleware, async (c) => {
  const user = c.get("user")
  const withdrawal = await getWithdrawalForUser(user.sub, getParam(c, "id"))
  return c.json(serialize(withdrawal))
})

export default withdrawals