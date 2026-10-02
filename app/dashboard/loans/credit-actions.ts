"use server";

import {revalidatePath} from "next/cache";
import {headers} from "next/headers";
import {z} from "zod";

import {auth} from "@/lib/auth";
import {requestCreditWithdrawal} from "@/lib/server/credits-api";
import {GoApiError} from "@/lib/server/go-api";
import {getLoan} from "@/lib/server/loans-api";
import type {LoanActionState} from "./actions";

// requestCreditWithdrawalAction uses the credit owner's member ID required by the backend contract.
export async function requestCreditWithdrawalAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = z.object({loanId: z.string().min(1), creditBalanceId: z.string().min(1), amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/), reason: z.string().trim().min(5)}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the withdrawal details.", fieldErrors: parsed.error.flatten().fieldErrors};
  const session = await auth.api.getSession({headers: await headers()}); if (!session?.user.id) return {ok: false, message: "Your session has expired."};
  try { const loan = (await getLoan({loanId: parsed.data.loanId})).loan; if (!loan) return {ok: false, message: "The loan could not be found."}; await requestCreditWithdrawal({creditBalanceId: parsed.data.creditBalanceId, amount: parsed.data.amount, reason: parsed.data.reason, requestedBy: loan.memberId}); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); return {ok: true, message: "Credit withdrawal requested."}; }
  catch (error) { if (error instanceof GoApiError) return {ok: false, message: `The request was not submitted. Reference: ${error.requestId}`}; console.error("Unexpected credit withdrawal failure", error); return {ok: false, message: "Something went wrong. Please try again."}; }
}
