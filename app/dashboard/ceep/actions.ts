"use server";

import { z } from "zod";
import { GoApiError, goApiGet, goApiPost } from "@/lib/server/go-api";
import { getCashContext } from "@/lib/server/contributions-api";
import { ceepReportSchema } from "@/app/components/ceep/ceep-report-data";

const reportRequest = z.object({
  period: z.iso.date().regex(/^\d{4}-\d{2}-01$/, "Choose a reporting month."),
  cutoff: z.union([z.iso.datetime({ offset: true }), z.literal("")]).default(""),
  title: z.string().trim().default(""),
  parish: z.string().trim().default(""),
  paymentDate: z.union([z.iso.date(), z.literal("")]).default(""),
});

// Loads authoritative figures through the existing authenticated gateway; the browser never assembles ledger data.
export async function loadCeepReport(data: FormData) {
  const parsed = reportRequest.safeParse(Object.fromEntries(data));
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0].message };
  }

  try {
    const query = new URLSearchParams(
      Object.entries(parsed.data).filter(([, value]) => value !== ""),
    );
    // response_body: "report" makes the HTTP response the report itself, without a wrapper.
    const [response, context] = await Promise.all([
      goApiGet(`/api/v1/contributions/ceep?${query}`),
      getCashContext(),
    ]);
    const report = ceepReportSchema.safeParse(response);
    if (!report.success || report.data.period !== parsed.data.period) {
      return { ok: false as const, message: "This report could not be read safely. Please contact support before exporting or finalizing it." };
    }
    return { ok: true as const, report: report.data, canApprove: context.canApprove };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof GoApiError
        ? error.detail ?? (error.status === 401 ? "Please sign in again." : "Unable to load the CEEP report. Please try again.")
        : "Unable to load the CEEP report. Please try again.",
    };
  }
}

// The preview hash binds approval to the reviewed report; omitting it could approve changed financial facts.
export async function finalizeCeepReport(data: FormData) {
  const parsed = reportRequest.extend({
    cutoff: z.iso.datetime({ offset: true }),
    previewHash: z.string().trim().min(1, "Load and review the report before finalizing."),
  }).safeParse(Object.fromEntries(data));
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0].message };
  }

  try {
    const response = await goApiPost(
      "/api/v1/contributions/ceep/finalize",
      Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== "")),
    );
    const report = ceepReportSchema.safeParse(response);
    if (!report.success || report.data.status !== "finalized" || report.data.period !== parsed.data.period) {
      return { ok: false as const, message: "Finalization returned an unrecognized report. Reload this month to check its saved status before trying again." };
    }
    return { ok: true as const, report: report.data };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof GoApiError
        ? error.detail ?? (error.status === 403 ? "You do not have permission to finalize this report." : "Finalization could not be confirmed. Reload this month to check its saved status before trying again.")
        : "Finalization could not be confirmed. Reload this month to check its saved status before trying again.",
    };
  }
}
