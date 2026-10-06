"use server"

import { z } from "zod"

import type { CashAllocationInput, CashAllocationType, CashContributionReceipt, CashierSession, Loan, Member, ShareAccount, ShareMoney } from "@/lib/go-api-client"
import { closeCashierSession, createCashContribution, openCashierSession } from "@/lib/server/contributions-api"
import { GoApiError } from "@/lib/server/go-api"
import { getLoan, listLoans } from "@/lib/server/loans-api"
import { getMember } from "@/lib/server/members-api"
import { getShareAccount } from "@/lib/server/shares-api"
import { MEMBER_BRANCH_ID } from "@/app/dashboard/members/config"

const moneySchema = z.string().trim().regex(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/, "Enter a valid KES amount.")
const positiveMoneySchema = moneySchema.refine((value) => minorUnits(value) > 0, "Amount must be greater than zero.")
const allocationSchema = z.object({
  type: z.enum(["CONTRIBUTION_ALLOCATION_TYPE_COM", "CONTRIBUTION_ALLOCATION_TYPE_LGOM", "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE", "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL", "CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE"]),
  targetId: z.uuid().optional(),
  amount: positiveMoneySchema,
})

// CashErrorState gives every action the same retry and field-error contract.
export type CashErrorState = {ok: false; message: string; retry?: boolean; fieldErrors?: Record<string, string[] | undefined>}

// CashMutationState carries the authoritative receipt or till returned by a successful mutation.
export type CashMutationState = null | CashErrorState | {ok: true; message: string; session?: CashierSession; receipt?: CashContributionReceipt}

// CashMemberState contains only the member and payable targets required by the entry form.
export type CashMemberState = null | CashErrorState | {ok: true; member: Member; shareAccount?: ShareAccount; loans: Loan[]}

// ValidatedAllocation names the checked JSON shape used during target ownership verification.
type ValidatedAllocation = {type: CashAllocationType; targetId?: string; amount: string}

// minorUnits compares and totals validated KES values as safe integer cents.
function minorUnits(value: string) {
  const [units, fraction = ""] = value.split(".")
  return Number(units) * 100 + Number(fraction.padEnd(2, "0"))
}

// moneyFrom converts validated decimal input to the protobuf Money JSON shape.
function moneyFrom(value: string): ShareMoney {
  const [units, fraction = ""] = value.split(".")
  return {currencyCode: "KES", units, nanos: Number(fraction.padEnd(9, "0"))}
}

// parseAllocations rejects malformed browser JSON before it reaches the contribution API.
function parseAllocations(value: FormDataEntryValue | null) {
  try {
    return allocationSchema.array().min(1, "Add at least one allocation.").safeParse(JSON.parse(String(value)))
  } catch {
    return allocationSchema.array().safeParse(null)
  }
}

// targetsBelongToMember prevents a crafted server-action request from paying another member's ledger.
async function targetsBelongToMember(memberId: string, allocations: ValidatedAllocation[]) {
  const checks = allocations.map(async (allocation) => {
    if (allocation.type === "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE") {
      if (!allocation.targetId) return false
      const result = await getShareAccount({branchId: MEMBER_BRANCH_ID, accountId: allocation.targetId})
      return result.account?.memberId === memberId && result.account.status === "SHARE_ACCOUNT_STATUS_ACTIVE"
    }
    if (allocation.type === "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL") {
      if (!allocation.targetId) return false
      const result = await getLoan({loanId: allocation.targetId})
      return result.loan?.memberId === memberId && ["LOAN_STATUS_DISBURSED", "LOAN_STATUS_ACTIVE", "LOAN_STATUS_DELINQUENT"].includes(result.loan.status)
    }
    return !allocation.targetId
  })
  return (await Promise.all(checks)).every(Boolean)
}

// failure maps transport outcomes without exposing internal backend details.
function failure(error: unknown): CashErrorState {
  if (error instanceof GoApiError) {
    const messages: Record<number, string> = {400: "Check the details and try again.", 401: "Your session has expired.", 403: "You do not have permission for this cash operation.", 404: "The requested cash record was not found.", 409: "This operation conflicts with the current cash state.", 504: "The cash service took too long to respond."}
    return {ok: false, retry: ![400, 401, 403, 404, 409, 422].includes(error.status), message: `${messages[error.status] ?? "The cash service is unavailable."} Reference: ${error.requestId}`}
  }
  console.error("Unexpected cash contribution failure", error)
  return {ok: false, retry: true, message: "Something went wrong. Please try again."}
}

// findCashMemberAction verifies the member and loads only targets that can receive this cash.
export async function findCashMemberAction(_previous: CashMemberState, formData: FormData): Promise<CashMemberState> {
  const parsed = z.object({nationalId: z.string().trim().min(3, "Enter a national ID.")}).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return {ok: false, message: "Check the national ID.", fieldErrors: parsed.error.flatten().fieldErrors}
  try {
    const result = await getMember({branchId: MEMBER_BRANCH_ID, nationalId: parsed.data.nationalId})
    if (!result.member) return {ok: false, message: "No member matched that national ID."}
    if (result.member.status !== "MEMBER_STATUS_ACTIVE") return {ok: false, message: "Cash contributions can only be recorded for active members."}
    const [shares, loans] = await Promise.all([
      getShareAccount({branchId: MEMBER_BRANCH_ID, nationalId: parsed.data.nationalId}).catch((error) => {
        if (error instanceof GoApiError && error.status === 404) return {account: undefined}
        throw error
      }),
      listLoans({memberId: result.member.id, pageSize: 50}),
    ])
    const payable = (loans.loans ?? []).filter((loan) => ["LOAN_STATUS_DISBURSED", "LOAN_STATUS_ACTIVE", "LOAN_STATUS_DELINQUENT"].includes(loan.status))
    return {ok: true, member: result.member, shareAccount: shares.account?.status === "SHARE_ACCOUNT_STATUS_ACTIVE" ? shares.account : undefined, loans: payable}
  } catch (error) {
    if (error instanceof GoApiError && error.status === 404) return {ok: false, message: "No member matched that national ID."}
    return failure(error)
  }
}

// openCashierSessionAction explicitly starts or resumes the authenticated cashier's till.
export async function openCashierSessionAction(): Promise<CashMutationState> {
  try {
    const result = await openCashierSession()
    if (!result.session) return {ok: false, message: "The backend returned no cashier session."}
    return {ok: true, message: "Till is open and ready.", session: result.session}
  } catch (error) {
    return failure(error)
  }
}

// recordCashContributionAction validates one allocation plan and preserves its idempotency key.
export async function recordCashContributionAction(_previous: CashMutationState, formData: FormData): Promise<CashMutationState> {
  const form = z.object({idempotencyKey: z.uuid(), sessionId: z.uuid(), memberId: z.uuid(), contributionPeriod: z.string().regex(/^\d{4}-\d{2}$/)}).safeParse(Object.fromEntries(formData))
  const allocations = parseAllocations(formData.get("allocations"))
  if (!form.success || !allocations.success) return {ok: false, message: "Check the contribution details.", fieldErrors: {...form.error?.flatten().fieldErrors, allocations: allocations.error?.issues.map((issue) => issue.message)}}
  const total = allocations.data.reduce((sum, item) => sum + minorUnits(item.amount), 0)
  const input: CashAllocationInput[] = allocations.data.map((item) => ({...item, amount: moneyFrom(item.amount)}))
  try {
    const member = await getMember({branchId: MEMBER_BRANCH_ID, memberId: form.data.memberId})
    if (member.member?.status !== "MEMBER_STATUS_ACTIVE") return {ok: false, message: "The member is no longer eligible for contributions."}
    if (!await targetsBelongToMember(form.data.memberId, allocations.data)) return {ok: false, message: "A selected share or loan target does not belong to this member."}
    const result = await createCashContribution({...form.data, contributionPeriod: `${form.data.contributionPeriod}-01`, amount: {currencyCode: "KES", units: String(Math.floor(total / 100)), nanos: total % 100 * 10_000_000}, allocations: input})
    if (!result.receipt) return {ok: false, message: "The backend returned no cash receipt."}
    const messages = {completed: "Cash received and allocations completed.", manual_review: "Cash was received, but its allocations require manual review."}
    return {ok: true, receipt: result.receipt, message: messages[result.receipt.status as keyof typeof messages] ?? `Cash receipt returned with status ${result.receipt.status}.`}
  } catch (error) {
    return failure(error)
  }
}

// closeCashierSessionAction lets the backend calculate and return the authoritative variance.
export async function closeCashierSessionAction(_previous: CashMutationState, formData: FormData): Promise<CashMutationState> {
  const parsed = z.object({sessionId: z.uuid(), countedAmount: moneySchema, varianceReason: z.string().trim().max(500)}).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return {ok: false, message: "Check the till count.", fieldErrors: parsed.error.flatten().fieldErrors}
  try {
    const result = await closeCashierSession({...parsed.data, countedAmount: moneyFrom(parsed.data.countedAmount)})
    if (!result.session) return {ok: false, message: "The backend returned no closed session."}
    return {ok: true, message: "Till closed and reconciled.", session: result.session}
  } catch (error) {
    return failure(error)
  }
}
