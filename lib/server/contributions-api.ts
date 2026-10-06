import "server-only"

import type { CashAllocationInput, CashContributionReceipt, CashierSession, ShareMoney } from "@/lib/go-api-client"
import { goApiPost } from "@/lib/server/go-api"

// openCashierSession opens a till or returns the authenticated cashier's existing open till.
export const openCashierSession = () =>
  goApiPost<{ session?: CashierSession }>("/api/v1/contributions/open-cashier-session", {})

// createCashContribution records one immutable cash receipt and its complete allocation plan.
export const createCashContribution = (input: {idempotencyKey: string; sessionId: string; memberId: string; amount: ShareMoney; contributionPeriod: string; allocations: CashAllocationInput[]}) =>
  goApiPost<{ receipt?: CashContributionReceipt }>("/api/v1/contributions/create-cash", input)

// closeCashierSession reconciles the cashier's counted notes against authoritative receipts.
export const closeCashierSession = (input: {sessionId: string; countedAmount: ShareMoney; varianceReason: string}) =>
  goApiPost<{ session?: CashierSession }>("/api/v1/contributions/close-cashier-session", input)
