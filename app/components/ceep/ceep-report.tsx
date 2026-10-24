"use client";

import { useState, useTransition } from "react";
import { DownloadIcon, FileSpreadsheetIcon, PrinterIcon } from "lucide-react";
import { loadCeepReport, finalizeCeepReport } from "@/app/dashboard/ceep/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { CeepReportTable } from "./ceep-report-table";
import { ceepAmountColumns, ceepRows, ceepTotals, type CEEPReport } from "./ceep-report-data";

// Owns the reviewed report and its exact request; editing controls discards approval eligibility immediately.
export function CeepReport({ initialMonth, currentMonth }: { initialMonth: string; currentMonth: string }) {
  const [fields, setFields] = useState({ month: initialMonth, cutoff: "", title: "Monthly CEEP report", parish: "", paymentDate: "" });
  const [loaded, setLoaded] = useState<{ report: CEEPReport; request: FormData; canApprove: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [mustReload, setMustReload] = useState(false);
  const report = loaded?.report;
  const finalized = report?.status === "finalized";
  const canFinalize = loaded?.canApprove && !finalized && report?.canFinalize
    && !report.hasErrors && !!report.previewHash && !mustReload;

  // Quotes all CSV cells and neutralizes spreadsheet formulas in member names and report headings.
  function downloadCsv() {
    if (!report) return;
    const rows = [
      [report.title, finalized ? "FINALIZED" : "DRAFT"],
      ["Parish", report.parish],
      ["Report month", report.period.slice(0, 7)],
      ["Payment date", report.paymentDate],
      ["Cutoff", report.cutoff],
      ["Generated", report.generatedAt],
      [],
      ["RecNo", "M.NO", "Full name", ...ceepAmountColumns.map(([, label]) => label)],
      ...ceepRows(report),
      ["Totals", "", "", ...ceepTotals(report)],
    ];
    const csv = rows.map((row) => row.map((cell) => {
      const text = /^[\s]*[=+@-]/.test(cell) && !/^-\d[\d,.]*$/.test(cell) ? `'${cell}` : cell;
      return `"${text.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `CEEP-${report.period.slice(0, 7)}-${report.status}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <section className="mx-auto flex min-w-0 max-w-screen-2xl flex-col gap-5 rounded-xl border bg-card p-4 text-card-foreground sm:p-5" aria-label="CEEP report workspace" aria-busy={pending}>
        <header className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">Monthly CEEP report</h1>
            <p className="text-sm text-muted-foreground">Review monthly member contributions, shares and loan balances.</p>
          </div>
          {report && <Badge variant={finalized ? "verified" : "pending"}>{finalized ? "Finalized" : "Draft"}</Badge>}
        </header>

        <form className="flex flex-col gap-4 print:hidden" onSubmit={(event) => {
          event.preventDefault();
          const request = new FormData();
          request.set("period", `${fields.month}-01`);
          request.set("cutoff", fields.cutoff ? `${fields.cutoff}:00+03:00` : "");
          request.set("title", fields.title);
          request.set("parish", fields.parish);
          request.set("paymentDate", fields.paymentDate);
          setError("");
          setLoaded(null);
          startTransition(async () => {
            try {
              const result = await loadCeepReport(request);
              if (!result.ok) { setError(result.message); return; }
              request.set("cutoff", result.report.cutoff);
              setLoaded({ report: result.report, request, canApprove: result.canApprove });
              setMustReload(false);
            } catch {
              setError("Unable to load the report. Please try again.");
            }
          });
        }} onChange={() => { setLoaded(null); setError(""); }}>
          <fieldset disabled={pending} className="min-w-0">
            <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="ceep-month">Report month</FieldLabel>
                <Input id="ceep-month" type="month" required max={currentMonth} value={fields.month} onChange={(event) => setFields({ ...fields, month: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ceep-cutoff">Cutoff · Nairobi time</FieldLabel>
                <Input id="ceep-cutoff" type="datetime-local" value={fields.cutoff} onChange={(event) => setFields({ ...fields, cutoff: event.target.value })} />
                <FieldDescription>Leave blank to use the time the report is loaded.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ceep-payment-date">Payment date · optional</FieldLabel>
                <Input id="ceep-payment-date" type="date" value={fields.paymentDate} onChange={(event) => setFields({ ...fields, paymentDate: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ceep-title">Report title</FieldLabel>
                <Input id="ceep-title" value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} />
              </Field>
              <Field className="lg:col-span-2">
                <FieldLabel htmlFor="ceep-parish">Parish</FieldLabel>
                <Input id="ceep-parish" placeholder="Parish name" value={fields.parish} onChange={(event) => setFields({ ...fields, parish: event.target.value })} />
              </Field>
            </FieldGroup>
          </fieldset>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="brand" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : <FileSpreadsheetIcon data-icon="inline-start" />} {pending ? "Please wait…" : "Load report"}</Button>
            <Button type="button" variant="brand-outline" disabled={!report || pending} onClick={downloadCsv}><DownloadIcon data-icon="inline-start" /> CSV</Button>
            <Button type="button" variant="brand-outline" disabled={!report || pending} onClick={() => window.print()}><PrinterIcon data-icon="inline-start" /> Print / Save PDF</Button>
            {loaded?.canApprove && !finalized && <Button type="button" variant="brand-soft" disabled={!canFinalize || pending} onClick={() => setConfirm(true)}>Finalize report</Button>}
          </div>
        </form>

        <div aria-live="polite" className="print:hidden">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {finalized && <p className="text-sm text-status-verified">This is the saved final report. Its figures and headings cannot be changed.</p>}
          {report && !finalized && report.period.slice(0, 7) >= currentMonth && <p className="text-sm text-muted-foreground">This month is still open. You can finalize after the month ends.</p>}
        </div>

        {pending && !report ? (
          <div className="flex flex-col gap-3" role="status" aria-label="Loading CEEP report">
            <Skeleton className="h-12 w-full" /><Skeleton className="h-56 w-full" />
          </div>
        ) : report ? (
          <article className="ceep-print flex min-w-0 flex-col gap-4">
            <Separator className="print:hidden" />
            <header className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{report.title || "Monthly CEEP report"}</h2>
                {!finalized && <Badge variant="pending">DRAFT</Badge>}
              </div>
              {report.parish && <p className="text-sm">{report.parish}</p>}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>Report month: {report.period.slice(0, 7)}</span>
                {report.paymentDate && <span>Payment date: {report.paymentDate}</span>}
                <span>Cutoff: {new Date(report.cutoff).toLocaleString("en-GB", { timeZone: "Africa/Nairobi" })} EAT</span>
                <span>Generated: {new Date(report.generatedAt).toLocaleString("en-GB", { timeZone: "Africa/Nairobi" })} EAT</span>
                <span>Amounts in KES</span>
              </div>
            </header>
            <CeepReportTable report={report} />
            <p className="text-xs text-muted-foreground print:hidden">Monthly loan paid is principal only. Interest is 1% of opening principal plus principal disbursed during the month.</p>
          </article>
        ) : !error && (
          <Empty className="min-h-56 border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FileSpreadsheetIcon /></EmptyMedia>
              <EmptyTitle>Choose a month to get started</EmptyTitle>
              <EmptyDescription>Load the CEEP table, review the figures, then export or finalize the report.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      <Dialog open={confirm} onOpenChange={(open) => { if (!pending) setConfirm(open); }}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Finalize this CEEP report?</DialogTitle>
            <DialogDescription>This saves the reviewed report for {report?.period.slice(0, 7)} permanently. Its figures and headings cannot be edited afterward.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="brand-outline" disabled={pending} onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="brand" disabled={pending || !canFinalize} onClick={() => {
              if (!loaded || !canFinalize) return;
              const request = new FormData();
              loaded.request.forEach((value, key) => request.set(key, value));
              request.set("previewHash", loaded.report.previewHash);
              setError("");
              startTransition(async () => {
                try {
                  const result = await finalizeCeepReport(request);
                  if (result.ok) setLoaded({ ...loaded, report: result.report });
                  else { setError(result.message); setMustReload(true); }
                } catch {
                  setError("Finalization could not be confirmed. Reload this month to check its saved status.");
                  setMustReload(true);
                }
                setConfirm(false);
              });
            }}>{pending && <Spinner data-icon="inline-start" />} {pending ? "Finalizing…" : "Finalize report"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
