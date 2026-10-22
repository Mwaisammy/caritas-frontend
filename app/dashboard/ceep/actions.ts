"use server";

import { z } from "zod";
import { GoApiError, goApiGet, goApiPost } from "@/lib/server/go-api";
import type { CEEPReport } from "./report";

// loadCEEPReport keeps the existing authenticated Go gateway boundary. Removing
// it would either expose tokens in the browser or bypass backend authorization.
export async function loadCEEPReport(
  input: {
    period: string;
    cutoff?: string;
    title?: string;
    parish?: string;
    paymentDate?: string;
    previewHash?: string;
  },
  finalize = false,
): Promise<
  { report: CEEPReport; error?: never } | { error: string; report?: never }
> {
  const parsed = z
    .object({
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/),
      cutoff: z.string().optional(),
      title: z.string().max(160).optional(),
      parish: z.string().max(160).optional(),
      paymentDate: z.string().optional(),
      previewHash: z.string().optional(),
    })
    .safeParse(input);
  if (!parsed.success)
    return { error: "Choose a valid reporting month and check the headings." };
  try {
    const report = finalize
      ? await goApiPost<CEEPReport>(
          "/api/v1/contributions/ceep/finalize",
          parsed.data,
        )
      : ((await goApiGet(
          `/api/v1/contributions/ceep?${new URLSearchParams(
            Object.entries(parsed.data).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )}`,
        )) as CEEPReport);
    return { report };
  } catch (error) {
    return {
      error:
        error instanceof GoApiError
          ? (error.detail ??
            (error.status === 403
              ? "You do not have permission to finalize CEEP reports."
              : error.status === 401
                ? "Sign in to access CEEP reports."
                : "Unable to load the report. Retry with the same month to retrieve any finalized report."))
          : "Unable to load the report. Please try again.",
    };
  }
}
