"use server";

import {revalidatePath, updateTag} from "next/cache";
import {headers} from "next/headers";
import {z} from "zod";

import {auth} from "@/lib/auth";
import type {ShareMoney} from "@/lib/go-api-client";
import {getMember} from "@/lib/server/members-api";
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
function failure(error: unknown): LoanActionState { if (error instanceof GoApiError) return {ok: false, message: `The loan service rejected the request. Reference: ${error.requestId}`}; console.error("Unexpected loan action failure", error); return {ok: false, message: "Something went wrong. Please try again."}; }

const applicationSchema = z.object({memberId: z.string().trim().min(1), principal: z.string().trim().regex(/^\d+(\.\d{1,2})?$/), interestRate: z.string().trim().regex(/^\d+(\.\d{1,4})?$/), repaymentPeriodMonths: z.coerce.number().int().positive().max(360), sharePledge: z.string().trim().regex(/^\d+(\.\d{1,2})?$/)});
const decisionSchema = z.object({loanId: z.string().trim().min(1), reason: z.string().trim().min(5).max(500)});

// applyForLoanAction validates terms and submits up to two clearly paired guarantors.
export async function applyForLoanAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the application details.", fieldErrors: parsed.error.flatten().fieldErrors};
  const nationalIds = formData.getAll("guarantorNationalId").map(String), amounts = formData.getAll("guaranteedAmount").map(String);
  const guarantors = nationalIds.map((nationalId, index) => ({nationalId: nationalId.trim(), guaranteedAmount: amounts[index]?.trim() ?? ""}));
  if (guarantors.some((item) => Boolean(item.nationalId) !== Boolean(item.guaranteedAmount))) return {ok: false, message: "Each guarantor needs both a national ID and guaranteed amount."};
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
    const resolvedGuarantors = await Promise.all(guarantors.filter((item) => item.nationalId).map(async (item) => {
      const {member} = await getMember({branchId: String(LOAN_BRANCH_ID), nationalId: item.nationalId});
      if (!member) throw new Error("Guarantor member not found");
      return {guarantorId: member.id, guaranteedAmount: item.guaranteedAmount};
    }));
    const result = await applyForLoan({memberId: parsed.data.memberId, branchId: LOAN_BRANCH_ID, principal: parsed.data.principal, interestRate: parsed.data.interestRate, repaymentPeriodMonths: parsed.data.repaymentPeriodMonths, officerId, guarantors: resolvedGuarantors, applicantSharePledgeAmount: moneyFrom(parsed.data.sharePledge)}); updateTag("loan-directory"); revalidatePath("/dashboard/loans"); return {ok: true, message: "Loan application submitted.", loanId: result.loanId}; } catch (error) { if (error instanceof GoApiError && error.status === 404) return {ok: false, message: "A guarantor was not found. Check each national ID."}; return failure(error); }
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
export async function addGuarantorAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> { const parsed = z.object({loanId: z.string().min(1), guarantorId: z.string().trim().min(1), guaranteedAmount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/)}).safeParse(Object.fromEntries(formData));

if (!parsed.success) return {ok: false, message: "Check the guarantor details.", fieldErrors: parsed.error.flatten().fieldErrors}; try { await addGuarantor(parsed.data); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`);

return {ok: true, message: "Guarantor added."}; } catch (error) { return failure(error); } }
// approveGuarantorAction records staff approval for one pending guarantee.
export async function approveGuarantorAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> { const parsed = z.object({loanId: z.string().min(1), guarantorId: z.string().min(1)}).safeParse(Object.fromEntries(formData)); if (!parsed.success) return {ok: false, message: "Invalid guarantor."}; const approvedBy = await currentUserId(); if (!approvedBy) return {ok: false, message: "Your session has expired."}; try { await approveGuarantor({...parsed.data, approvedBy}); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); return {ok: true, message: "Guarantor approved."}; } catch (error) { return failure(error); } }
// removeGuarantorAction removes only the selected guarantor from the selected loan.
export async function removeGuarantorAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> { const parsed = z.object({loanId: z.string().min(1), guarantorId: z.string().min(1)}).safeParse(Object.fromEntries(formData)); if (!parsed.success) return {ok: false, message: "Invalid guarantor."}; try { await removeGuarantor(parsed.data); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); return {ok: true, message: "Guarantor removed."}; } catch (error) { return failure(error); } }
