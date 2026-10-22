"use client";

import { useState, useTransition } from "react";
import { DownloadIcon, PrinterIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadCEEPReport } from "./actions";

// CEEPReport describes the saved reporting contract, including nullable facts.
// It preserves source facts while the report displays unhandled columns as zero.
export type CEEPReport = {
  branchId: string;
  period: string;
  cutoff: string;
  generatedAt: string;
  title: string;
  parish: string;
  paymentDate: string;
  status: "draft" | "finalized";
  previewHash: string;
  canFinalize: boolean;
  hasErrors: boolean;
  finalizedBy?: string;
  finalizedAt?: string;
  issues: { severity: string; reference: string; message: string }[];
  rows: {
    memberId: string;
    memberNumber: string;
    fullName: string;
    recNo: string;
    com: string;
    lgom: string;
    previousShares: string | null;
    sharesPaid: string;
    totalShares: string | null;
    literature: string;
    registration: string;
    groupRegistration: null;
    lsf: string;
    principalDisbursed: string | null;
    principalPaid: string;
    openingPrincipal: string | null;
    loanBalance: string | null;
    interestAssessed: string | null;
    interestPaid: string;
    closingPrincipal: string | null;
    laptop: string;
    penalty: string;
    totalPaid: string;
    credit: string;
    otherCharges: string;
    otherShareMovements: string | null;
    newDisbursements: string | null;
    otherPrincipalMovements: string | null;
    loans: {
      id: string;
      disbursed: string;
      opening: string;
      closing: string;
      rate: string;
      interestAssessed: string | null;
      unpaidAssessedInterest: string;
      movements: {
        id: string;
        type: string;
        amount: string;
        split: {
          principal?: string;
          interest?: string;
          penalty?: string;
          credit?: string;
        };
      }[];
    }[];
    allocations: {
      id: string;
      receiptId: string;
      type: string;
      targetId: string | null;
      amount: string;
      transactionId: string | null;
      category: string | null;
      reason: string | null;
    }[];
    receipts: {
      id: string;
      reference: string;
      amount: string;
      source: string;
      receivedAt: string;
      status: string;
      included: boolean;
      completedAt: string | null;
    }[];
    shareMovements: { id: string; type: string; amount: string }[];
    fees: {
      type: string;
      assessed: string;
      paid: string;
      outstanding: string;
      exemptionReason: string | null;
      approvedBy: string | null;
    }[];
    charges: {
      id: string;
      category: string;
      reason: string;
      assessed: string;
      paid: string;
      outstanding: string;
    }[];
  }[];
};

// decimalTotal sums exact amounts and rounds their display to at most two places.
// Number would introduce binary rounding into the report and downloadable totals.
function decimalTotal(values: (string | null)[]) {
  const total = values.reduce((sum, value) => {
    const [whole, fraction = ""] = (value ?? "0").replace(/^-/, "").split(".");
    const amount =
      BigInt(whole) * BigInt(10000) + BigInt(fraction.padEnd(4, "0"));
    return sum + ((value ?? "0").startsWith("-") ? -amount : amount);
  }, BigInt(0));
  const absolute = total < BigInt(0) ? -total : total;
  const cents = (absolute + BigInt(50)) / BigInt(100);
  const fraction = String(cents % BigInt(100)).padStart(2, "0").replace(/0+$/, "");
  return `${total < BigInt(0) && cents > BigInt(0) ? "-" : ""}${cents / BigInt(100)}${fraction ? `.${fraction}` : ""}`;
}

// CEEPWorkspace owns the reviewed dataset so printing, CSV and finalization all
// use the same preview; removing it would let exports regenerate different data.
export function CEEPWorkspace() {
  const [report, setReport] = useState<CEEPReport>();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const columns = [
    ["recNo", "Recno"],
    ["memberNumber", "M.NO"],
    ["fullName", "Full name"],
    ["com", "COM"],
    ["previousShares", "Previous Shares"],
    ["sharesPaid", "Shares paid"],
    ["totalShares", "T. shares"],
    ["lgom", "LGOM"],
    ["literature", "Sale of literature"],
    ["registration", "CARITAS Reg"],
    ["groupRegistration", "Group Reg"],
    ["lsf", "LSF"],
    ["principalDisbursed", "Principal disbursed"],
    ["principalPaid", "Monthly loanPaid"],
    ["loanBalance", "Loan balance"],
    ["interestAssessed", "Interest 1%"],
    ["closingPrincipal", "Loan balance after pay"],
    ["laptop", "Laptop"],
    ["penalty", "Penalty"],
    ["totalPaid", "Total Amt"],
  ] as const;


  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 print:hidden">
        <h1 className="text-2xl font-semibold">CEEP monthly monitoring</h1>
        <p className="text-muted-foreground">
          Review and finalize the monthly CEEP report.
        </p>
      </div>
      <form
        className="flex flex-col gap-4 print:hidden"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            setError("");
            const result = await loadCEEPReport({
              period: `${data.get("month")}-01`,
              cutoff: data.get("cutoff")
                ? new Date(String(data.get("cutoff"))).toISOString()
                : undefined,
              title: String(data.get("title") ?? ""),
              parish: String(data.get("parish") ?? ""),
              paymentDate: String(data.get("paymentDate") ?? ""),
            });
            if (result.report) setReport(result.report);
            else {
              setError(result.error);
              setReport(undefined);
            }
          });
        }}
      >
        <FieldGroup className="md:grid md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="ceep-month">Reporting month</FieldLabel>
            <Input id="ceep-month" name="month" type="month" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="ceep-title">
              Branch / institution heading
            </FieldLabel>
            <Input
              id="ceep-title"
              name="title"
              maxLength={160}
              placeholder="Defaults to your branch number"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ceep-parish">Parish</FieldLabel>
            <Input id="ceep-parish" name="parish" maxLength={160} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ceep-cutoff">
              Cutoff (your local time)
            </FieldLabel>
            <Input id="ceep-cutoff" name="cutoff" type="datetime-local" />
            <FieldDescription>
              Leave blank to use now. Report months use Africa/Nairobi.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ceep-payment-date">
              Payment date (optional)
            </FieldLabel>
            <Input id="ceep-payment-date" name="paymentDate" type="date" />
            <FieldDescription>
              Leave blank when receipts have different payment dates.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending}>
          {pending ? "Loading…" : "Load report"}
        </Button>
      </form>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to complete request</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {report ? (
        <>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={() => {
                const previousTitle = document.title;
                document.title = `CEEP-${report.branchId}-${report.period.slice(0, 7)}-${report.status}`;
                window.addEventListener(
                  "afterprint",
                  () => {
                    document.title = previousTitle;
                  },
                  { once: true },
                );
                window.print();
              }}
            >
              <PrinterIcon data-icon="inline-start" />
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const headings = columns;
                const csvRows: string[][] = [
                  [
                    "CEEP monthly monitoring report",
                    report.title,
                    report.parish,
                  ],
                  [
                    "Branch",
                    report.branchId,
                    "Period",
                    report.period,
                    "Cutoff",
                    report.cutoff,
                    "Generated",
                    report.generatedAt,
                    "Status",
                    report.status,
                    "Payment date",
                    report.paymentDate,
                  ],
                  headings.map(([, label]) => label),
                  ...report.rows.map((row) =>
                    headings.map(([key], index) => index < 3 ? row[key] ?? "0" : decimalTotal([row[key]])),
                  ),
                  headings.map(([key], index) =>
                    index === 0
                      ? "TOTAL"
                      : index < 3
                        ? ""
                        : (decimalTotal(report.rows.map((row) => row[key])) ??
                          "0"),
                  ),

                ];
                // Quoting preserves names and references; prefixing formula-like text
                // prevents spreadsheet software from executing member-supplied content.
                const csv = csvRows
                  .map((row) =>
                    row
                      .map(
                        (cell) =>
                          `"${(/^\s*[=+@]|^[\t\r\n]|^-(?!\d+(?:\.\d+)?$)/.test(cell) ? `'${cell}` : cell).replaceAll('"', '""')}"`,
                      )
                      .join(","),
                  )
                  .join("\r\n");
                const url = URL.createObjectURL(
                  new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = `CEEP-${report.branchId}-${report.period.slice(0, 7)}-${report.status}.csv`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <DownloadIcon data-icon="inline-start" />
              Download CSV
            </Button>
            {report.canFinalize ? (
              <Button
                disabled={pending || report.hasErrors}
                onClick={() =>
                  startTransition(async () => {
                    setError("");
                    const result = await loadCEEPReport(
                      {
                        period: report.period,
                        cutoff: report.cutoff,
                        title: report.title,
                        parish: report.parish,
                        paymentDate: report.paymentDate,
                        previewHash: report.previewHash,
                      },
                      true,
                    );
                    if (result.report) setReport(result.report);
                    else setError(result.error);
                  })
                }
              >
                {pending ? "Finalizing…" : "Finalize reviewed report"}
              </Button>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {report.rows.length} members · {report.status}
            </span>
          </div>
          <article className="ceep-report flex min-w-0 flex-col gap-4">
            <header className="flex flex-col gap-1 text-center">
              <h2 className="text-xl font-semibold">{report.title}</h2>
              {report.parish ? <p>{report.parish}</p> : null}
              <h3 className="font-medium">
                CEEP MONTHLY MONITORING REPORT
                {report.status === "draft" ? " — DRAFT" : ""}
              </h3>
              <p className="text-sm">
                Month: {report.period.slice(0, 7)} · Branch: {report.branchId} ·
                Payment date: {report.paymentDate || "Multiple"}
              </p>
              <p className="text-xs">
                Cutoff:{" "}
                {new Date(report.cutoff).toLocaleString("en-KE", {
                  timeZone: "Africa/Nairobi",
                })}{" "}
                EAT · Generated:{" "}
                {new Date(report.generatedAt).toLocaleString("en-KE", {
                  timeZone: "Africa/Nairobi",
                })}{" "}
                EAT
              </p>
              {report.finalizedAt ? (
                <p className="text-xs">
                  Finalized:{" "}
                  {new Date(report.finalizedAt).toLocaleString("en-KE", {
                    timeZone: "Africa/Nairobi",
                  })}{" "}
                  EAT · Officer: {report.finalizedBy}
                </p>
              ) : null}
            </header>
            <Table className="ceep-table">
              <caption className="sr-only">
                Monthly member contributions and historical balances in KES
              </caption>
              <TableHeader>
                <TableRow>
                  {columns.map(([key, label]) => (
                    <TableHead key={key}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row) => (
                  <TableRow key={row.memberId}>
                    {columns.map(([key], index) => (
                      <TableCell
                        key={key}
                        className={index < 3 ? "" : "text-right tabular-nums"}
                      >
                        {index < 3 ? row[key] ?? "0" : decimalTotal([row[key]])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  {columns.map(([key], index) => (
                    <TableCell
                      key={key}
                      className="text-right font-semibold tabular-nums"
                    >
                      {index === 0
                        ? "TOTAL"
                        : index < 3
                          ? ""
                          : (decimalTotal(report.rows.map((row) => row[key])) ??
                            "0")}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
            {report.rows.length === 0 ? (
              <p>
                No eligible members or receipts were found for this branch
                month.
              </p>
            ) : null}
          </article>
        </>
      ) : null}
    </div>
  );
}
