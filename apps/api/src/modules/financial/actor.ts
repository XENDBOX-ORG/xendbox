import { prisma } from "@xendbox/database"
import { getOrCreateOrganizationAccount, getOrCreateUserAccount } from "./financial.service"

/**
 * Financial actor classification.
 *
 * Financial capability is actor-specific. A financial account existing does NOT
 * imply the actor can withdraw or hold a virtual account.
 */
export type FinancialActorKind =
  | "MERCHANT"
  | "INDEPENDENT_RIDER"
  | "COMPANY_RIDER"
  | "LOGISTICS_COMPANY"
  | "PICKUP_STATION"
  | "INDIVIDUAL"
  | "PLATFORM"

export interface WithdrawableAccount {
  accountId: string
  kind: FinancialActorKind
}

export async function resolveFinancialActorKind(
  ownerType: string,
  ownerId: string
): Promise<FinancialActorKind> {
  if (ownerType === "ORGANIZATION") {
    const org = await prisma.organization.findUnique({
      where: { id: ownerId },
      select: { type: true },
    })
    switch (org?.type) {
      case "MERCHANT":
        return "MERCHANT"
      case "LOGISTICS_COMPANY":
        return "LOGISTICS_COMPANY"
      case "PICKUP_STATION":
        return "PICKUP_STATION"
      default:
        return "INDIVIDUAL"
    }
  }
  if (ownerType === "PLATFORM") return "PLATFORM"
  if (ownerType === "USER") {
    const rider = await prisma.rider.findUnique({
      where: { user_id: ownerId },
      select: { type: true },
    })
    if (rider?.type === "INDEPENDENT") return "INDEPENDENT_RIDER"
    if (rider?.type === "COMPANY") return "COMPANY_RIDER"
    const consumer = await prisma.consumer.findUnique({
      where: { user_id: ownerId },
      include: { merchant_profile: { select: { id: true } } },
    })
    if (consumer?.merchant_profile) return "MERCHANT"
    return "INDIVIDUAL"
  }
  return "INDIVIDUAL"
}

export function canWithdraw(kind: FinancialActorKind): boolean {
  return (
    kind === "INDEPENDENT_RIDER" ||
    kind === "LOGISTICS_COMPANY" ||
    kind === "PICKUP_STATION"
  )
}

export function canHaveVirtualAccount(kind: FinancialActorKind): boolean {
  return (
    kind === "MERCHANT" ||
    kind === "INDEPENDENT_RIDER" ||
    kind === "LOGISTICS_COMPANY" ||
    kind === "PICKUP_STATION"
  )
}

/**
 * Resolves the account a user is allowed to withdraw from, if any.
 * - Independent rider  -> personal USER account
 * - Logistics company  -> ORGANIZATION account (any active member)
 * - Pickup station     -> ORGANIZATION account (any active member)
 * Merchants, company riders and individual consumers have no withdrawable account.
 */
export async function getWithdrawableAccountForUser(
  userId: string
): Promise<WithdrawableAccount | null> {
  const rider = await prisma.rider.findUnique({
    where: { user_id: userId },
    select: { type: true },
  })
  if (rider?.type === "INDEPENDENT") {
    const account = await getOrCreateUserAccount(userId)
    return { accountId: account.id, kind: "INDEPENDENT_RIDER" }
  }
  if (rider?.type === "COMPANY") return null

  const memberships = await prisma.organizationMember.findMany({
    where: { user_id: userId, status: "ACTIVE" },
    include: { organization: { select: { type: true } } },
  })
  for (const member of memberships) {
    if (member.organization.type === "LOGISTICS_COMPANY") {
      const account = await getOrCreateOrganizationAccount(member.organization_id)
      return { accountId: account.id, kind: "LOGISTICS_COMPANY" }
    }
    if (member.organization.type === "PICKUP_STATION") {
      const account = await getOrCreateOrganizationAccount(member.organization_id)
      return { accountId: account.id, kind: "PICKUP_STATION" }
    }
  }
  return null
}
