"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getCreditBalance,
  listCreditOperations,
  manageCredit,
} from "@/lib/server/credits-api";
import { getCashContext } from "@/lib/server/contributions-api";
import { GoApiError } from "@/lib/server/go-api";
import { getLoan, listLoans } from "@/lib/server/loans-api";

// loadCreditWorkspaceAction restores availability and reservations; without it a refreshed page could offer reserved money again.
export async function loadCreditWorkspaceAction(
  loanId: string,
  creditBalanceId: string,
  pageToken = "",
) {
  if (
    !z.uuid().safeParse(loanId).success ||
    !z.uuid().safeParse(creditBalanceId).success
  )
    return { ok: false as const, message: "Invalid credit reference." };
  try {
    const { loan } = await getLoan({ loanId });
    if (!loan) return { ok: false as const, message: "Loan not found." };
    const [context, credits, history, loans] = await Promise.all([
      getCashContext(),
      getCreditBalance({ memberId: loan.memberId }),
      listCreditOperations(creditBalanceId, pageToken),
      listLoans({ memberId: loan.memberId, pageSize: 100 }),
    ]);
    const credit = credits.credits.find((row) => row.id === creditBalanceId);
    if (!credit) return { ok: false as const, message: "Credit not found." };
    return {
      ok: true as const,
      context,
      credit,
      ...history,
      loans: loans.loans.filter((row) =>
        [
          "LOAN_STATUS_ACTIVE",
          "LOAN_STATUS_DELINQUENT",
          "LOAN_STATUS_RESTRUCTURING",
        ].includes(row.status),
      ),
    };
  } catch {
    return {
      ok: false as const,
      message: "Unable to load credit availability and history.",
    };
  }
}

// manageCreditAction preserves an operation ID and member instruction; without it a retry can become a second reservation.
export async function manageCreditAction(data: FormData) {
  const parsed = z
    .object({
      loanId: z.uuid(),
      operationId: z.uuid(),
      creditBalanceId: z.uuid(),
      action: z.enum([
        "transfer_shares",
        "apply_loan",
        "request_refund",
        "approve_refund",
        "reject_refund",
        "record_refund",
      ]),
      amount: z
        .string()
        .regex(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/)
        .optional(),
      targetId: z.uuid().optional(),
      contributionPeriod: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
        .optional(),
      reason: z.string().trim().min(5),
      consentReference: z.string().trim().optional(),
      payoutReference: z.string().trim().optional(),
      payoutEvidence: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return {
      ok: false as const,
      definitive: true,
      message: "Check the amount, reason and credit instructions.",
    };
  try {
    const { loanId, ...input } = parsed.data;
    const operation = await manageCredit({
      ...input,
      contributionPeriod: input.contributionPeriod
        ? `${input.contributionPeriod}-01`
        : undefined,
    });
    revalidatePath(`/dashboard/loans/${loanId}`);
    return {
      ok: true as const,
      message:
        operation.status === "pending"
          ? "Refund amount reserved for independent approval."
          : `Credit operation ${operation.status}.`,
      operation,
    };
  } catch (error) {
    return {
      ok: false as const,
      definitive:
        error instanceof GoApiError && [3, 5, 7, 9].includes(error.code ?? 0),
      message:
        error instanceof GoApiError
          ? (error.detail ??
            `Outcome unconfirmed. Refresh history before retrying. Reference: ${error.requestId}`)
          : "Outcome unconfirmed. Refresh history before retrying.",
    };
  }
}
