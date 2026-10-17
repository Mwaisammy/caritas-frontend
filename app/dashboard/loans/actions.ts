"use server";

import {revalidatePath, updateTag} from "next/cache";
import {headers} from "next/headers";
import {z} from "zod";

import {auth} from "@/lib/auth";
import type {ShareMoney} from "@/lib/go-api-client";
import {listMembers} from "@/lib/server/members-api";
import {getShareAccount, getShareBalance} from "@/lib/server/shares-api";
import {GoApiError} from "@/lib/server/go-api";
import {addGuarantor, applyForLoan, approveGuarantor, approveLoan, disburseLoan, getLoan, rejectLoan, removeGuarantor} from "@/lib/server/loans-api";
import {LOAN_BRANCH_ID} from "./config";

// LoanActionState gives all loan forms one small success and validation contract.
export type LoanActionState = null | {ok: true; message: string; loanId?: string} | {ok: false; message: string; fieldErrors?: Record<string, string[] | undefined>};

// currentUserId supplies officer fields from authentication instead of trusting form input.
async function currentUserId() { const session = await auth.api.getSession({headers: await headers()}); return session?.user.id; }
// moneyFrom converts a decimal pledge into the protobuf Money shape expected by the backend.
function moneyFrom(value: string): ShareMoney { const [units, fraction = ""] = value.split("."); return {currencyCode: "KES", units, nanos: Number(fraction.padEnd(9, "0"))}; }
// failure turns transport errors into useful feedback while preserving the request reference.
function failure(error: unknown): LoanActionState {
  if (error instanceof GoApiError) {
    const message = error.status === 401 ? "Your session has expired. Sign in again."
      : error.status === 403 ? "Your staff role does not have permission for this action."
      : error.detail?.replace(/^exec tx: /, "")
        ?? (error.status === 504 ? "The request timed out. Reload to check its status before retrying."
          : "The loan service could not complete the request. Please try again.");
    return {ok: false, message: `${message} Reference: ${error.requestId}`};
  }
  console.error("Unexpected loan action failure", error);
  return {ok: false, message: "Something went wrong. Please try again."};
}

const applicationSchema = z.object({memberId: z.uuid(), principal: z.string().trim().regex(/^\d+(\.\d{1,2})?$/), interestRate: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a monthly percentage with up to two decimal places."), repaymentPeriodMonths: z.coerce.number().int().positive().max(36), sharePledge: z.string().trim().regex(/^\d+(\.\d{1,2})?$/)});
const decisionSchema = z.object({loanId: z.string().trim().min(1), reason: z.string().trim().min(5).max(500)});

// applyForLoanAction validates paired guarantees; the backend remains authoritative for capacity and eligibility.
export async function applyForLoanAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the application details.", fieldErrors: parsed.error.flatten().fieldErrors};
  const memberIds = formData.getAll("guarantorId").map(String), amounts = formData.getAll("guaranteedAmount").map(String);
  const guarantors = memberIds.map((guarantorId, index) => ({guarantorId: guarantorId.trim(), guaranteedAmount: amounts[index]?.trim() ?? ""}));
  if (guarantors.some((item) => Boolean(item.guarantorId) !== Boolean(item.guaranteedAmount))) return {ok: false, message: "Select a member and enter an amount for every guarantor used."};
  if (guarantors.some((item) => item.guarantorId && !z.uuid().safeParse(item.guarantorId).success)) return {ok: false, message: "Select each guarantor from the member search results."};
  if (guarantors.some((item) => item.guaranteedAmount && !/^\d+(\.\d{1,2})?$/.test(item.guaranteedAmount))) return {ok: false, message: "Enter a valid guaranteed amount for every guarantor."};
  const officerId = await currentUserId(); if (!officerId) return {ok: false, message: "Your session has expired."};
  try {
    const {loan} = await getLoan({memberId: parsed.data.memberId});
    if (!loan) return {ok: false, message: "Could not verify this member's existing loan. Please try again."};
    return {ok: false, message: "This member has an existing loan that must be closed before another application."};
  } catch (error) {
    if (!(error instanceof GoApiError && error.status === 404)) {
      return {ok: false, message: "Could not verify this member's existing loan. Please try again."};
    }
  }
  try {
    // The form accepts percentages; storage uses a monthly fraction. Without conversion, 1% becomes 100%.
    const [wholeRate, fractionRate = ""] = parsed.data.interestRate.split(".");
    const scaledRate = BigInt(wholeRate) * BigInt(100) + BigInt(fractionRate.padEnd(2, "0"));
    const interestRate = `${scaledRate / BigInt(10_000)}.${(scaledRate % BigInt(10_000)).toString().padStart(4, "0")}`;
    const result = await applyForLoan({memberId: parsed.data.memberId, branchId: LOAN_BRANCH_ID, principal: parsed.data.principal, interestRate, repaymentPeriodMonths: parsed.data.repaymentPeriodMonths, officerId, guarantors: guarantors.filter((item) => item.guarantorId), applicantSharePledgeAmount: moneyFrom(parsed.data.sharePledge)}); updateTag("loan-directory"); revalidatePath("/dashboard/loans"); return {ok: true, message: "Loan application submitted.", loanId: result.loanId}; } catch (error) { return failure(error); }
}

// approveLoanAction records the authenticated approver and refreshes the workspace.
export async function approveLoanAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> { const parsed = decisionSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return {ok: false, message: "Provide an approval reason.", fieldErrors: parsed.error.flatten().fieldErrors}; const officerId = await currentUserId(); if (!officerId) return {ok: false, message: "Your session has expired."}; try { await approveLoan({...parsed.data, officerId}); updateTag("loan-directory"); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); return {ok: true, message: "Loan approved."}; } catch (error) { return failure(error); } }
// rejectLoanAction records the reason required for a rejected application.
export async function rejectLoanAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> { const parsed = decisionSchema.safeParse(Object.fromEntries(formData)); 
  if (!parsed.success) return {ok: false, message: "Provide a rejection reason.", fieldErrors: parsed.error.flatten().fieldErrors}; const loanOfficer = await currentUserId();
   if (!loanOfficer) return {ok: false, message: "Your session has expired."}; try { await rejectLoan({...parsed.data, loanOfficer}); updateTag("loan-directory"); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`);
   return {ok: true, message: "Loan rejected."}; } catch (error) { return failure(error); } }
// disburseLoanAction records the authenticated officer before releasing approved funds.
export async function disburseLoanAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> { 
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData)); 
  if (!parsed.success) return {
    ok: false, 
    message: "Provide a disbursement reason.", 
    fieldErrors: parsed.error.flatten().fieldErrors}; 
    const loanOfficer = await currentUserId(); 
  if (!loanOfficer) return {ok: false, message: "Your session has expired."}; 
  try { await disburseLoan({...parsed.data, loanOfficer}); updateTag("loan-directory"); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); return {ok: true, message: "Loan disbursed."}; } catch (error) { return failure(error); } }

// addGuarantorAction attaches a member and guaranteed amount to the current loan.
export async function addGuarantorAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = z.object({
    loanId: z.uuid(),
    guarantorId: z.uuid("Select a guarantor from the search results."),
    guaranteedAmount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the guarantor details.", fieldErrors: parsed.error.flatten().fieldErrors};
  try {
    await addGuarantor(parsed.data);
    revalidatePath(`/dashboard/loans/${parsed.data.loanId}`);
    return {ok: true, message: "Guarantor added."};
  } catch (error) {
    return failure(error);
  }
}
// approveGuarantorAction records staff approval for one pending guarantee.
export async function approveGuarantorAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = z.object({loanId: z.uuid(), guarantorId: z.uuid()}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Invalid guarantor."};
  const approvedBy = await currentUserId();
  if (!approvedBy) return {ok: false, message: "Your session has expired."};
  try {
    await approveGuarantor({...parsed.data, approvedBy});
    revalidatePath(`/dashboard/loans/${parsed.data.loanId}`);
    return {ok: true, message: "Guarantor approved; their shares are reserved."};
  } catch (error) {
    return failure(error);
  }
}
// removeGuarantorAction removes only the selected guarantor from the selected loan.
export async function removeGuarantorAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = z.object({loanId: z.uuid(), guarantorId: z.uuid()}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Invalid guarantor."};
  try {
    await removeGuarantor(parsed.data);
    revalidatePath(`/dashboard/loans/${parsed.data.loanId}`);
    return {ok: true, message: "Guarantor removed and reserved shares released."};
  } catch (error) {
    return failure(error);
  }
}

// searchGuarantorMembersAction searches the member service, avoiding an incomplete client-side name filter.
export async function searchGuarantorMembersAction(search: string, pageToken = "") {
  if (typeof search !== "string" || search.length > 100 || typeof pageToken !== "string")
    return {ok: false as const, message: "Enter a name, membership number, or national ID (up to 100 characters)."};
  try {
    const result = await listMembers({branchId: String(LOAN_BRANCH_ID), pageSize: 20, search: search.trim(), statusFilter: "MEMBER_STATUS_ACTIVE", ...(pageToken && {pageToken})});
    return {ok: true as const, members: result.members ?? [], nextPageToken: result.nextPageToken};
  } catch (error) {
    const state = failure(error);
    return {ok: false as const, message: state?.message ?? "Could not search members."};
  }
}

// getMemberShareSecurityAction supplies applicant and guarantor previews from the same authoritative Shares balance.
export async function getMemberShareSecurityAction(memberId: string) {
  if (!z.uuid().safeParse(memberId).success) return {ok: false as const, message: "Select a member first."};
  try {
    const {account} = await getShareAccount({branchId: String(LOAN_BRANCH_ID), memberId});
    if (!account) return {ok: false as const, message: "This member has no share account."};
    if (account.status !== "SHARE_ACCOUNT_STATUS_ACTIVE") return {ok: false as const, message: "This member needs an active share account to provide loan security."};
    const result = await getShareBalance({accountId: account.id, consistencyStrong: true});
    return {ok: true as const, ...result, accountId: account.id};
  } catch (error) {
    const state = failure(error);
    return {ok: false as const, message: state?.message ?? "Could not check share availability."};
  }
}
