"use server";

import {revalidatePath} from "next/cache";
import {headers} from "next/headers";
import {z} from "zod";

import {auth} from "@/lib/auth";
import {listCreditOperations, requestCreditWithdrawal} from "@/lib/server/credits-api";
import {GoApiError} from "@/lib/server/go-api";
import {getLoan} from "@/lib/server/loans-api";
import type {LoanActionState} from "./actions";

// requestCreditWithdrawalAction uses the credit owner's member ID required by the backend contract.
export async function requestCreditWithdrawalAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = z.object({loanId: z.uuid(), creditBalanceId: z.uuid(), amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/).refine((value) => Number(value) > 0, "Enter an amount greater than zero."), reason: z.string().trim().min(5), idempotencyKey: z.uuid(), consentReference: z.string().trim().min(5)}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the withdrawal details.", fieldErrors: parsed.error.flatten().fieldErrors};
  const session = await auth.api.getSession({headers: await headers()}); if (!session?.user.id) return {ok: false, message: "Your session has expired."};
  try { const loan = (await getLoan({loanId: parsed.data.loanId})).loan; if (!loan) return {ok: false, message: "The loan could not be found."}; await requestCreditWithdrawal({creditBalanceId: parsed.data.creditBalanceId, amount: parsed.data.amount, reason: parsed.data.reason, requestedBy: loan.memberId, idempotencyKey: parsed.data.idempotencyKey, consentReference: parsed.data.consentReference}); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); revalidatePath("/dashboard/loans"); return {ok: true, message: "Refund requested. Funds are reserved pending independent approval and recorded payout."}; }
  catch (error) { if (error instanceof GoApiError) return {ok: false, message: `The request was not submitted. Reference: ${error.requestId}`}; console.error("Unexpected credit withdrawal failure", error); return {ok: false, message: "Something went wrong. Please try again."}; }
}

// getCreditOperationsAction exposes authorized credit history without letting the browser infer reservations.
export async function getCreditOperationsAction(creditBalanceId: string, pageToken = "") {
  if (!z.uuid().safeParse(creditBalanceId).success || typeof pageToken !== "string") return {ok: false as const, message: "Invalid credit reference."};
  try { return {ok: true as const, ...await listCreditOperations(creditBalanceId, pageToken)}; }
  catch { return {ok: false as const, message: "Credit activity could not be loaded. Please retry."}; }
}
