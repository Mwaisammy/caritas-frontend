"use server";

import { z } from "zod";
import { GoApiError, goApiGet, goApiPost } from "@/lib/server/go-api";

// The four register operations share validation and a response shape. Without
// this boundary the browser could accept malformed money or bypass gateway auth.
export async function dividendAction(
  operation: "load" | "approve" | "choice" | "settle",
  data: FormData,
) {
  const annual = z.object({
    financialYear: z.coerce.number().int().min(2000).max(9998),
    declarationDate: z.iso.date(),
    rate: z
      .string()
      .regex(
        /^\d{1,3}(\.\d{1,4})?$/,
        "Enter a rate with at most four decimal places.",
      ),
  });
  const input = Object.fromEntries(data);
  const parsed =
    operation === "load"
      ? annual.safeParse(input)
      : operation === "approve"
        ? annual
            .extend({
              previewHash: z.string().min(1),
              resolutionReference: z.string().trim().min(1).max(200),
            })
            .safeParse(input)
        : operation === "choice"
          ? z
              .object({
                allocationId: z.guid(),
                choice: z.enum(["cash", "shares"]),
              })
              .safeParse(input)
          : operation === "settle"
            ? z
                .object({
                  allocationId: z.guid(),
                  voucherReference: z.string().trim().max(200).optional(),
                  paymentDate: z
                    .union([z.iso.date(), z.literal("")])
                    .optional(),
                })
                .safeParse(input)
            : null;
  if (!parsed?.success) {
    return {
      ok: false as const,
      message:
        parsed?.error.issues[0]?.message ?? "Unknown dividend operation.",
    };
  }
  try {
    const response =
      operation === "load"
        ? await goApiGet(
            `/api/v1/contributions/dividends?${new URLSearchParams(Object.entries(parsed.data).map(([key, value]) => [key, String(value)]))}`,
          )
        : await goApiPost(
            `/api/v1/contributions/dividends/${operation}`,
            parsed.data,
          );
    const money = z.string().regex(/^\d+(\.\d+)?$/);
    const report = z
      .object({
        financialYear: z.number().int(),
        declarationDate: z.iso.date(),
        rate: money,
        status: z.enum(["draft", "approved"]),
        approvedTotal: money,
        canManage: z.boolean(),
        previewHash: z.string().optional(),
        hasErrors: z.boolean().optional(),
        resolutionReference: z.string().optional(),
        approvedBy: z.string().optional(),
        approvedAt: z.string().optional(),
        cashPaid: money.optional(),
        reinvested: money.optional(),
        outstanding: money.optional(),
        allocations: z.array(
          z.object({
            id: z.guid().optional(),
            memberId: z.guid(),
            memberNumber: z.string(),
            name: z.string(),
            shareBalance: z.string().regex(/^-?\d+(\.\d+)?$/),
            amount: money,
            eligible: z.boolean(),
            reason: z.string(),
            memberStatus: z.string(),
            months: z.array(
              z.object({
                month: z.iso.date(),
                amount: money,
                qualifies: z.boolean(),
                sources: z.array(
                  z.object({
                    receiptId: z.guid(),
                    transactionId: z.guid(),
                    amount: money,
                  }),
                ),
              }),
            ),
            choice: z.enum(["cash", "shares"]).nullable().optional(),
            choiceBy: z.string().nullable().optional(),
            choiceAt: z.string().nullable().optional(),
            voucherReference: z.string().nullable().optional(),
            paymentDate: z.string().nullable().optional(),
            postedTransactionId: z.string().nullable().optional(),
            settledBy: z.string().nullable().optional(),
            settledAt: z.string().nullable().optional(),
          }),
        ),
      })
      .safeParse(response);
    if (!report.success) {
      return {
        ok: false as const,
        message:
          "The dividend response could not be read safely. Reload the register before proceeding.",
      };
    }
    return { ok: true as const, report: report.data };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof GoApiError
          ? (error.detail ??
            "The operation could not be confirmed. Reload the register before retrying.")
          : "The operation could not be confirmed. Reload the register before retrying.",
    };
  }
}
