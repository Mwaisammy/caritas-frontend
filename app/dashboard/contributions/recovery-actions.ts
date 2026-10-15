"use server";

import { z } from "zod";
import {
  getCashContext,
  listDarajaPayments,
  recoverDarajaPayment,
} from "@/lib/server/contributions-api";
import { GoApiError } from "@/lib/server/go-api";

// loadDarajaRecoveryAction restores branch-scoped unresolved work; without it browser loss hides payments.
export async function loadDarajaRecoveryAction(pageToken = "") {
  try {
    const context = await getCashContext();
    const result = await listDarajaPayments(pageToken);
    return { ok: true as const, context, ...result };
  } catch {
    return {
      ok: false as const,
      message: "Unable to load M-Pesa recovery. Try again.",
    };
  }
}

// recoverDarajaAction validates evidence before staff can recover money; removing it exposes unchecked form data.
export async function recoverDarajaAction(data: FormData) {
  const parsed = z
    .object({
      paymentRequestId: z.uuid(),
      action: z.enum(["query", "retry_posting", "reconcile"]),
      checkoutRequestId: z.string().trim().optional(),
      mpesaReference: z.string().trim().optional(),
      amount: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
      receivedAt: z.string().optional(),
      evidence: z.string().trim().optional(),
      reason: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return { ok: false as const, message: "Check the recovery details." };
  const input = parsed.data;
  if (
    input.action === "reconcile" &&
    (!input.evidence ||
      !input.reason ||
      !input.mpesaReference ||
      !input.amount ||
      !input.receivedAt ||
      !Number.isFinite(Date.parse(input.receivedAt)))
  )
    return {
      ok: false as const,
      message:
        "Enter the verified M-Pesa reference, amount, payment time, business record evidence and reason.",
    };
  try {
    await recoverDarajaPayment({
      ...input,
      amount: input.amount
        ? {
            currencyCode: "KES",
            units: input.amount.split(".")[0],
            nanos: Number((input.amount.split(".")[1] ?? "").padEnd(9, "0")),
          }
        : undefined,
      receivedAt: input.receivedAt
        ? new Date(input.receivedAt).toISOString()
        : undefined,
    });
    return {
      ok: true as const,
      message:
        "Recovery saved. Refresh to see processing progress. No new payment prompt was sent.",
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof GoApiError
          ? (error.detail ??
            `Recovery could not be confirmed. Reference: ${error.requestId}. Refresh before retrying.`)
          : "Recovery could not be confirmed. Refresh before retrying.",
    };
  }
}
