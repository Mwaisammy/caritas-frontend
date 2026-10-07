"use server";

import {revalidatePath, updateTag} from "next/cache";
import {headers} from "next/headers";
import {z} from "zod";

import {auth} from "@/lib/auth";
import {GoApiError} from "@/lib/server/go-api";
import {recordRepayment} from "@/lib/server/repayments-api";
import type {LoanActionState} from "./actions";

// recordRepaymentAction validates gateway identity and attributes the payment to authenticated staff.
export async function recordRepaymentAction(_state: LoanActionState, formData: FormData): Promise<LoanActionState> {
  const parsed = z.object({loanId: z.string().min(1), amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/), paymentGatewayTransactionId: z.string().trim().min(2)}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the repayment details.", fieldErrors: parsed.error.flatten().fieldErrors};
  const session = await auth.api.getSession({headers: await headers()}); if (!session?.user.id) return {ok: false, message: "Your session has expired."};
  try { await recordRepayment({...parsed.data, createdBy: session.user.id}); updateTag("loan-directory"); revalidatePath(`/dashboard/loans/${parsed.data.loanId}`); return {ok: true, message: "Repayment recorded."}; }
  catch (error) { if (error instanceof GoApiError) return {ok: false, message: `The repayment was not recorded. Reference: ${error.requestId}`}; console.error("Unexpected repayment failure", error); return {ok: false, message: "Something went wrong. Please try again."}; }
}
