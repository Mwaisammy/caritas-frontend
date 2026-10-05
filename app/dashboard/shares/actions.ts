"use server";

import {revalidatePath} from "next/cache";
import {headers} from "next/headers";
import {z} from "zod";

import {auth} from "@/lib/auth";
import type {ShareMoney} from "@/lib/go-api-client";
import {GoApiError} from "@/lib/server/go-api";
import {createShareAdjustment, openShareAccount, purchaseShares, reverseShareTransaction, withdrawShares} from "@/lib/server/shares-api";
import {SHARE_BRANCH_ID} from "./config";

const transactionSchema = z.object({
  accountId: z.string().trim().min(1),
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid positive amount."),
  referenceId: z.string().trim().min(2, "Enter a reference ID.").max(100),
  reason: z.string().trim().min(5, "Provide a reason of at least 5 characters.").max(500),
});

// The action state gives every share dialog the same success and field-error contract.
export type ShareActionState = null | {ok: true; message: string; accountId?: string} | {ok: false; message: string; retry?: boolean; fieldErrors?: Record<string, string[] | undefined>};

// Money conversion is centralized so every mutation sends identical protobuf money values.
function moneyFrom(value: string): ShareMoney {
  const [units, fraction = ""] = value.split(".");
  const negative = value.startsWith("-");
  return {currencyCode: "KES", units: units === "-0" ? "0" : units, nanos: Number(fraction.padEnd(9, "0")) * (negative ? -1 : 1)};
}

// The authenticated user ID supplies the temporary originator field until the backend derives it from JWT.
async function currentUserId() {
  const session = await auth.api.getSession({headers: await headers()});
  return session?.user.id;
}

// Shared failure mapping keeps backend errors readable without duplicating request IDs in every action.
function failure(error: unknown): ShareActionState {
  if (error instanceof GoApiError) {
    const messages: Record<number, string> = {400: "Check the details and try again.", 401: "Your session has expired.", 403: "You do not have permission for this action.", 404: "The share record was not found.", 409: "This action conflicts with the account's current state.", 504: "The share service took too long to respond."};
    return {ok: false, retry: ![400, 401, 403, 404, 409, 422].includes(error.status), message: `${messages[error.status] ?? "The share service is unavailable."} Reference: ${error.requestId}`};
  }
  console.error("Unexpected share action failure", error);
  return {ok: false, retry: true, message: "Something went wrong. Please try again."};
}

// Opens a share account after validating the only administrator-supplied identifier.
export async function openShareAccountAction(_previous: ShareActionState, formData: FormData): Promise<ShareActionState> {
  const parsed = z.object({memberId: z.string().trim().min(1, "Enter a member ID.")}).safeParse({memberId: formData.get("memberId")});
  if (!parsed.success) return {ok: false, message: "Check the member ID.", fieldErrors: parsed.error.flatten().fieldErrors};
  try {
    const result = await openShareAccount({memberId: parsed.data.memberId, branchId: SHARE_BRANCH_ID});
    revalidatePath("/dashboard/shares");
    return {ok: true, message: "Share account opened successfully.", accountId: result.accountId};
  } catch (error) {
    return failure(error);
  }
}

// Records a purchase and refreshes both the account detail and directory views.
export async function purchaseSharesAction(_previous: ShareActionState, formData: FormData): Promise<ShareActionState> {
  const parsed = transactionSchema.extend({referenceId: z.uuid()}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the purchase details.", fieldErrors: parsed.error.flatten().fieldErrors};
  try {
    const originatorId = await currentUserId();
    if (!originatorId) return {ok: false, message: "Your session has expired."};
    await purchaseShares({...parsed.data, amount: moneyFrom(parsed.data.amount), originatorId});
    revalidatePath(`/dashboard/shares/${parsed.data.accountId}`);
    return {ok: true, message: "Share purchase recorded."};
  } catch (error) {
    if (error instanceof GoApiError && error.status === 409) return {ok: false, message: "This reference was already used with a different amount. Review the original transaction."};
    return failure(error);
  }
}

// Records a withdrawal while leaving balance enforcement to the authoritative share service.
export async function withdrawSharesAction(_previous: ShareActionState, formData: FormData): Promise<ShareActionState> {
  const parsed = transactionSchema.extend({referenceId: z.uuid()}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the withdrawal details.", fieldErrors: parsed.error.flatten().fieldErrors};
  try {
    const originatorId = await currentUserId();
    if (!originatorId) return {ok: false, message: "Your session has expired."};
    await withdrawShares({...parsed.data, amount: moneyFrom(parsed.data.amount), originatorId});
    revalidatePath(`/dashboard/shares/${parsed.data.accountId}`);
    return {ok: true, message: "Share withdrawal recorded."};
  } catch (error) {
    if (error instanceof GoApiError && error.status === 409) return {ok: false, message: "This reference was already used with a different amount. Review the original transaction."};
    return failure(error);
  }
}

// Creates an auditable adjustment request without pretending approval is available in this UI.
export async function createAdjustmentAction(_previous: ShareActionState, formData: FormData): Promise<ShareActionState> {
  const parsed = transactionSchema.extend({amount: z.string().trim().regex(/^-?\d+(\.\d{1,2})?$/, "Enter a valid amount.")}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the adjustment details.", fieldErrors: parsed.error.flatten().fieldErrors};
  try {
    const originatorId = await currentUserId();
    if (!originatorId) return {ok: false, message: "Your session has expired."};
    const result = await createShareAdjustment({...parsed.data, amount: moneyFrom(parsed.data.amount), originatorId});
    return {ok: true, message: `Adjustment ${result.adjustmentId} was created for approval.`};
  } catch (error) {
    return failure(error);
  }
}

// Reverses one known transaction after the user supplies a fresh reference and reason.
export async function reverseTransactionAction(_previous: ShareActionState, formData: FormData): Promise<ShareActionState> {
  const parsed = z.object({transactionId: z.string().min(1), accountId: z.string().min(1), referenceId: z.string().trim().min(2), reason: z.string().trim().min(5)}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {ok: false, message: "Check the reversal details.", fieldErrors: parsed.error.flatten().fieldErrors};
  try {
    await reverseShareTransaction({transactionId: parsed.data.transactionId, referenceId: parsed.data.referenceId, reason: parsed.data.reason});
    revalidatePath(`/dashboard/shares/${parsed.data.accountId}`);
    return {ok: true, message: "Transaction reversed."};
  } catch (error) {
    return failure(error);
  }
}
