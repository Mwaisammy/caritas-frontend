"use client";

import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  Coins,
  Search,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { dividendAction } from "./actions";

export default function DividendsPage() {
  const [report, setReport] = useState<
    | Extract<
        Awaited<ReturnType<typeof dividendAction>>,
        { ok: true }
      >["report"]
    | null
  >(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState("");
  const [choice, setChoice] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [rate, setRate] = useState("5");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const dates = new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const [financialYear, setFinancialYear] = useState(
    Number(today.slice(0, 4)) - 1,
  );
  const selected = report?.allocations.find(
    (row) => (row.id ?? row.memberId) === selectedId,
  );
  const visible =
    report?.allocations.filter((row) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = `${row.name} ${row.memberNumber}`
        .toLowerCase()
        .includes(query);
      const matchesStatus =
        status === "All statuses" ||
        (status === "Paid" && row.settledAt && row.choice === "cash") ||
        (status === "Reinvested" && row.settledAt && row.choice === "shares") ||
        (status === "Pending" &&
          report.status === "approved" &&
          row.eligible &&
          !row.settledAt) ||
        (status === "Excluded" && !row.eligible) ||
        (status === "Proposed" && report.status === "draft" && row.eligible);
      return matchesSearch && matchesStatus;
    }) ?? [];
  const settled =
    report?.allocations.filter((row) => Boolean(row.settledAt)) ?? [];
  const eligibleCount =
    report?.allocations.filter((row) => row.eligible).length ?? 0;
  const payableCount =
    report?.allocations.filter((row) => row.eligible && Number(row.amount) > 0)
      .length ?? 0;
  const settledCount = settled.length;
  const settledAmount = settled.reduce(
    (total, row) => total + Number(row.amount),
    0,
  );
  const payoutProgress = report
    ? Math.min(
        100,
        (settledAmount / Math.max(Number(report.approvedTotal), 1)) * 100,
      )
    : 0;
  const outstandingAmount =
    report?.status === "approved"
      ? (report.outstanding ?? report.approvedTotal)
      : "0";
  const latestSettlementMonth = settled.reduce((latest, row) => {
    const month = (row.paymentDate ?? row.settledAt ?? "").slice(0, 7);
    return month > latest ? month : latest;
  }, "");
  const activity = latestSettlementMonth
    ? Array.from({ length: 6 }, (_, index) => {
        const date = new Date(`${latestSettlementMonth}-01T00:00:00Z`);
        date.setUTCMonth(date.getUTCMonth() - (5 - index));
        const key = date.toISOString().slice(0, 7);
        return {
          month: new Intl.DateTimeFormat("en-KE", {
            month: "short",
            timeZone: "UTC",
          }).format(date),
          amount: settled
            .filter(
              (row) =>
                (row.paymentDate ?? row.settledAt ?? "").slice(0, 7) === key,
            )
            .reduce((total, row) => total + Number(row.amount), 0),
        };
      })
    : [];
  const maxActivity = Math.max(...activity.map((item) => item.amount), 0);

  // Ledger values arrive as decimal strings. Formatting integer cents avoids
  // losing money precision when large balances are converted to JS numbers.
  function money(value: string) {
    const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
    const hundred = BigInt(100);
    const cents =
      BigInt(whole) * hundred +
      BigInt((fraction + "00").slice(0, 2)) +
      BigInt(Number(fraction[2] ?? "0") >= 5 ? 1 : 0);
    const sign = value.startsWith("-") && cents > BigInt(0) ? "-" : "";
    return `KSh ${sign}${new Intl.NumberFormat("en-KE").format(cents / hundred)}.${(cents % hundred).toString().padStart(2, "0")}`;
  }

  // All mutation forms keep the last confirmed register on failure; without this
  // shared transition an unconfirmed payment could appear to have succeeded.
  function submit(
    operation: Parameters<typeof dividendAction>[0],
    data: FormData,
  ) {
    setMessage("");
    setHasError(false);
    startTransition(async () => {
      try {
        const result = await dividendAction(operation, data);
        if (result.ok) {
          setReport(result.report);
          setFinancialYear(result.report.financialYear);
          setRate(result.report.rate);
          setMessage(
            operation === "load"
              ? "Register preview updated."
              : operation === "approve"
                ? "Annual allocations approved."
                : operation === "choice"
                  ? "Member choice recorded. You can now complete settlement."
                  : "Dividend settled successfully.",
          );
        } else {
          setHasError(true);
          setMessage(result.message);
        }
      } catch {
        setHasError(true);
        setMessage(
          "The operation could not be confirmed. Reload the register before retrying.",
        );
      }
    });
  }

  return (
    <div className="min-h-screen p-6 text-gray-900 lg:p-7">
      <header className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:px-7">
        <div className="relative z-10">
          <p className="text-sm font-medium text-slate-500">Member returns</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Dividends</h1>
            {report && (
              <Badge variant="outline">
                {report.financialYear} ·{" "}
                {report.status === "approved" ? "Approved" : "Preview"}
              </Badge>
            )}
          </div>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Follow dividend declarations, member payouts and distribution
            progress.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setSelectedId("");
              setSearch("");
              setStatus("All statuses");
              const data = new FormData(event.currentTarget);
              data.set("declarationDate", today);
              data.set("rate", rate);
              submit("load", data);
            }}
          >
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Financial year
              <Input
                name="financialYear"
                type="number"
                min="2000"
                max={Number(today.slice(0, 4)) - 1}
                value={financialYear}
                onChange={(event) => {
                  const year = Number(event.target.value);
                  setFinancialYear(year);
                  if (year !== report?.financialYear) setRate("5");
                }}
                className="h-10 w-36 text-sm text-slate-700"
                required
              />
            </label>
            <Button type="submit" disabled={pending} className="h-10">
              {pending ? "Loading…" : "Load register"}
            </Button>
          </form>
        </div>
        <div className="absolute right-10 top-1/2 hidden size-28 -translate-y-1/2 items-center justify-center rounded-full bg-red-50 text-[#c51f25] md:flex">
          <Wallet className="size-16" strokeWidth={1.4} />
        </div>
      </header>

      {message && (
        <Alert
          variant={hasError ? "destructive" : "default"}
          aria-live="polite"
        >
          <AlertTitle>
            {hasError ? "Action needs attention" : "Dividend register"}
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {!report ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Choose a financial year</EmptyTitle>
            <EmptyDescription>
              Load an approved register or prepare an annual preview.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <section
            aria-label="Dividend summary"
            className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[
              {
                label:
                  report.status === "approved"
                    ? "Total declared"
                    : "Total proposed",
                value: money(report.approvedTotal),
                detail: `${report.financialYear} distribution`,
                icon: Coins,
                color: "bg-red-50 text-[#c51f25]",
              },
              {
                label: "Paid out",
                value: money(report.cashPaid ?? "0"),
                detail:
                  report.status === "approved"
                    ? `Cash payments · ${((Number(report.cashPaid ?? 0) / Math.max(Number(report.approvedTotal), 1)) * 100).toFixed(1)}% of declared`
                    : "Cash settlement opens after approval",
                icon: Wallet,
                color: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Pending payout",
                value: money(outstandingAmount),
                detail:
                  report.status === "approved"
                    ? "Awaiting member choice or settlement"
                    : "Register awaits approval",
                icon: Clock3,
                color: "bg-amber-50 text-amber-700",
              },
              {
                label: "Eligible members",
                value: eligibleCount.toLocaleString("en-KE"),
                detail: `Of ${report.allocations.length.toLocaleString("en-KE")} members`,
                icon: UsersRound,
                color: "bg-blue-50 text-blue-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <span className={`rounded-xl p-2.5 ${item.color}`}>
                    <item.icon className="size-5" />
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </section>

          {report.hasErrors && (
            <Alert variant="destructive" className="mt-5">
              <AlertTitle>Historical balances need review</AlertTitle>
              <AlertDescription>
                Resolve negative balances or duplicate share accounts before
                approving this register.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            <section
              aria-labelledby="distribution-heading"
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="distribution-heading"
                    className="text-lg font-semibold"
                  >
                    Distribution activity
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Settled member allocations by month
                  </p>
                </div>
                <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-slate-600">
                  Latest six payout months
                </span>
              </div>
              {activity.length > 0 ? (
                <>
                  <div className="mt-8 flex h-56 items-end gap-3 border-b border-gray-100 px-2 sm:gap-6">
                    {activity.map((item) => (
                      <div
                        key={item.month}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-xs font-semibold text-slate-500">
                          {item.amount > 0 ? money(String(item.amount)) : "—"}
                        </span>
                        <div
                          style={{
                            height: `${item.amount > 0 ? Math.max((item.amount / maxActivity) * 82, 4) : 0}%`,
                          }}
                          className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#c51f25] to-[#f19b9e]"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-3 px-2 text-center text-xs text-slate-500 sm:gap-6">
                    {activity.map((item, index) => (
                      <span key={`${item.month}-${index}`} className="flex-1">
                        {item.month}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-8 flex h-56 items-center justify-center rounded-xl bg-gray-50 text-sm text-slate-500">
                  No settled payouts in this register yet.
                </div>
              )}
            </section>

            <section
              aria-labelledby="cycle-heading"
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="cycle-heading" className="text-lg font-semibold">
                    Distribution cycle
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {report.financialYear} financial year ·{" "}
                    {Number(report.rate).toLocaleString("en-KE", {
                      maximumFractionDigits: 0,
                    })}
                    % rate
                  </p>
                </div>
                <span className="rounded-xl bg-red-50 p-2.5 text-[#c51f25]">
                  <CalendarDays className="size-5" />
                </span>
              </div>
              <div className="mt-7 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">
                  Payout progress
                </span>
                <span className="font-semibold text-[#c51f25]">
                  {payoutProgress.toFixed(1)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Payout progress"
                aria-valuenow={payoutProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-red-100"
              >
                <div
                  className="h-full rounded-full bg-[#c51f25]"
                  style={{ width: `${payoutProgress}%` }}
                />
              </div>
              <div className="mt-7 space-y-4 border-t border-gray-100 pt-5 text-sm">
                <div className="flex items-center gap-3">
                  {report.status === "approved" ? (
                    <CircleCheck className="size-5 text-emerald-600" />
                  ) : (
                    <Clock3 className="size-5 text-amber-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {report.status === "approved"
                        ? "Dividend declared"
                        : "Dividend preview"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {report.approvedAt
                        ? `Approved ${dates.format(new Date(report.approvedAt))}`
                        : `Declared for review · ${dates.format(new Date(report.declarationDate))}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {report.status === "approved"
                      ? "Complete"
                      : "Needs approval"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {settledCount >= payableCount &&
                  report.status === "approved" ? (
                    <CircleCheck className="size-5 text-emerald-600" />
                  ) : (
                    <Clock3 className="size-5 text-amber-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Member payouts</p>
                    <p className="text-xs text-slate-500">
                      {settledCount} of {payableCount} payable members settled
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {settledCount >= payableCount &&
                    report.status === "approved"
                      ? "Complete"
                      : settledCount > 0
                        ? "In progress"
                        : "Upcoming"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {Number(outstandingAmount) === 0 &&
                  report.status === "approved" ? (
                    <CircleCheck className="size-5 text-emerald-600" />
                  ) : (
                    <Clock3 className="size-5 text-amber-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Final reconciliation</p>
                    <p className="text-xs text-slate-500">
                      {report.status === "draft"
                        ? "Available after the register is approved"
                        : Number(outstandingAmount) === 0
                          ? "No dividend balance remains outstanding"
                          : `${money(outstandingAmount)} remains outstanding`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {report.status === "draft"
                      ? "Upcoming"
                      : Number(outstandingAmount) === 0
                        ? "Complete"
                        : "Upcoming"}
                  </span>
                </div>
              </div>

              {report.status === "draft" && report.canManage && (
                <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData();
                      data.set("financialYear", String(report.financialYear));
                      data.set("declarationDate", report.declarationDate);
                      data.set("rate", rate);
                      submit("load", data);
                    }}
                  >
                    <label
                      className="flex-1 text-xs font-medium text-slate-500"
                      htmlFor="yearRate"
                    >
                      Annual rate (%)
                      <Input
                        id="yearRate"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={rate}
                        onChange={(event) => setRate(event.target.value)}
                        className="mt-1"
                        required
                      />
                    </label>
                    <Button type="submit" variant="outline" disabled={pending}>
                      Update rate
                    </Button>
                  </form>
                  <form
                    className="space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      data.set("financialYear", String(report.financialYear));
                      data.set("declarationDate", report.declarationDate);
                      data.set("rate", report.rate);
                      data.set("previewHash", report.previewHash ?? "");
                      submit("approve", data);
                    }}
                  >
                    <Input
                      name="resolutionReference"
                      placeholder="Reason for approval"
                      aria-label="Reason for approval"
                      maxLength={200}
                      required
                      className="px-4"
                    />
                    <Button
                      type="submit"
                      disabled={pending || report.hasErrors}
                      className="w-full"
                    >
                      {pending ? "Working…" : "Approve distribution"}
                    </Button>
                  </form>
                </div>
              )}
              {report.approvedAt && (
                <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-slate-500">
                  Resolution {report.resolutionReference}
                </p>
              )}
            </section>
          </div>
          <section
            aria-labelledby="members-heading"
            className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="members-heading" className="text-lg font-semibold">
                  Recent member payouts
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {visible.length} of {report.allocations.length} member
                  allocations
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <span className="sr-only">Search member payouts</span>
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name or member no."
                    className="h-10 w-full pl-9 sm:w-56"
                  />
                </label>
                <label>
                  <span className="sr-only">Filter payout status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#c51f25]"
                  >
                    <option>All statuses</option>
                    <option>Paid</option>
                    <option>Reinvested</option>
                    <option>Pending</option>
                    <option>Excluded</option>
                    {report.status === "draft" && <option>Proposed</option>}
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Member no.
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Member name
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Period
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Share balance
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Dividend
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.memberId}
                      tabIndex={pending ? -1 : 0}
                      aria-label={`Open details for ${row.name || row.memberNumber}`}
                      onClick={() => {
                        if (pending) return;
                        setSelectedId(row.id ?? row.memberId);
                        setChoice([]);
                        setMessage("");
                        setHasError(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.currentTarget.click();
                        }
                      }}
                      className="cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-2 focus-visible:outline-[#c51f25]"
                    >
                      <td className="px-4 py-3 text-slate-500">
                        {row.memberNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium">
                          {row.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {report.financialYear}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {money(row.shareBalance)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {money(row.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {row.settledAt
                          ? dates.format(
                              new Date(row.paymentDate ?? row.settledAt),
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.settledAt
                              ? row.choice === "cash"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                              : row.eligible
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-100 text-slate-600"
                          }`}
                        >
                          {row.settledAt ? (
                            row.choice === "cash" ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <CircleCheck className="size-3" />
                            )
                          ) : row.eligible ? (
                            <Clock3 className="size-3" />
                          ) : null}
                          {!row.eligible
                            ? "Excluded"
                            : row.settledAt
                              ? row.choice === "cash"
                                ? "Paid"
                                : "Reinvested"
                              : report.status === "draft"
                                ? "Proposed"
                                : row.choice
                                  ? "Awaiting settlement"
                                  : "Awaiting choice"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No payouts match your search and status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <Dialog
            open={Boolean(selected)}
            onOpenChange={(open) => {
              if (!open && !pending) setSelectedId("");
            }}
          >
            {selected && (
              <DialogContent
                className="max-h-[calc(100dvh-2rem)] min-w-0 overflow-y-auto sm:max-w-xl"
                showCloseButton={!pending}
              >
                <DialogHeader>
                  <DialogTitle className="break-words pr-6">
                    {selected.name || `Member ${selected.memberNumber}`}
                  </DialogTitle>
                  <DialogDescription>
                    Member {selected.memberNumber} · {report.financialYear}{" "}
                    dividend
                  </DialogDescription>
                </DialogHeader>
                <dl className="grid min-w-0 grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <dt className="text-sm text-muted-foreground">
                      Share balance
                    </dt>
                    <dd className="break-words font-medium tabular-nums">
                      {money(selected.shareBalance)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-sm text-muted-foreground">Dividend</dt>
                    <dd className="break-words font-semibold tabular-nums">
                      {money(selected.amount)}
                    </dd>
                  </div>
                </dl>
                <section
                  className="flex flex-col gap-3"
                  aria-label="Contribution eligibility"
                >
                  <h3 className="font-medium">Six-month contribution check</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selected.months.map((month) => (
                      <Card key={month.month} size="sm" className="min-w-0">
                        <CardHeader>
                          <CardDescription>
                            {new Intl.DateTimeFormat("en-KE", {
                              month: "short",
                              year: "numeric",
                              timeZone: "Africa/Nairobi",
                            }).format(new Date(month.month))}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                          <p className="break-words font-medium tabular-nums">
                            {money(month.amount)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {month.qualifies
                                ? "Minimum met"
                                : "Below minimum"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {month.sources.length} contribution
                              {month.sources.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {message && (
                  <Alert
                    variant={hasError ? "destructive" : "default"}
                    aria-live="polite"
                  >
                    <AlertTitle>
                      {hasError ? "Action needs attention" : "Update saved"}
                    </AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {selected.settledAt ? (
                  <Alert>
                    <AlertTitle>
                      {selected.choice === "cash"
                        ? "Cash payment completed"
                        : "Dividend added to shares"}
                    </AlertTitle>
                    <AlertDescription>
                      <p>
                        Settled{" "}
                        {dates.format(
                          new Date(selected.paymentDate ?? selected.settledAt),
                        )}
                        .
                      </p>
                      {selected.voucherReference && (
                        <p className="break-words">
                          Voucher / register: {selected.voucherReference}
                        </p>
                      )}
                      {selected.postedTransactionId && (
                        <p>
                          Share credit reference:{" "}
                          {selected.postedTransactionId.split("-")[0]}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : !selected.eligible ? (
                  <Alert>
                    <AlertTitle>Not eligible this year</AlertTitle>
                    <AlertDescription>{selected.reason}</AlertDescription>
                  </Alert>
                ) : Number(selected.amount) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    There is no dividend payable for this member.
                  </p>
                ) : report.status === "draft" ? (
                  <p className="text-sm text-muted-foreground">
                    Approve the annual register before recording a choice or
                    settling this dividend.
                  </p>
                ) : !report.canManage ? (
                  <p className="text-sm text-muted-foreground">
                    An admin or manager can record the member&apos;s choice and
                    settle this dividend.
                  </p>
                ) : !selected.choice ? (
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      data.set("allocationId", selected.id!);
                      data.set("choice", choice[0] ?? "");
                      submit("choice", data);
                    }}
                  >
                    <FieldGroup>
                      <Field>
                        <FieldLabel id="choice-label">
                          How does the member want to receive this dividend?
                        </FieldLabel>
                        <ToggleGroup
                          className="flex-wrap"
                          aria-labelledby="choice-label"
                          value={choice}
                          onValueChange={setChoice}
                          disabled={pending}
                          variant="outline"
                        >
                          <ToggleGroupItem type="button" value="cash">
                            Cash
                          </ToggleGroupItem>
                          <ToggleGroupItem type="button" value="shares">
                            Add to shares
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <FieldDescription>
                          Confirm the member&apos;s instruction before saving.
                          It cannot be changed here afterward.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                    <Button
                      type="submit"
                      disabled={pending || choice.length !== 1}
                    >
                      {pending ? "Saving…" : "Record member choice"}
                    </Button>
                  </form>
                ) : (
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      data.set("allocationId", selected.id!);
                      submit("settle", data);
                    }}
                  >
                    <p className="text-sm text-muted-foreground">
                      Member chose{" "}
                      {selected.choice === "cash"
                        ? "cash payment"
                        : "reinvestment in shares"}
                      {selected.choiceAt
                        ? ` on ${dates.format(new Date(selected.choiceAt))}`
                        : ""}
                      .
                    </p>
                    {selected.choice === "cash" && (
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="voucherReference">
                            Signed voucher / register reference
                          </FieldLabel>
                          <Input
                            id="voucherReference"
                            name="voucherReference"
                            placeholder="Voucher number or register page and row"
                            maxLength={200}
                            required
                          />
                          <FieldDescription>
                            Use a unique payment reference. Confirm only after
                            handing over cash and obtaining the member&apos;s
                            signature or thumbprint.
                          </FieldDescription>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="paymentDate">
                            Actual payment date
                          </FieldLabel>
                          <Input
                            id="paymentDate"
                            name="paymentDate"
                            type="date"
                            min={report.declarationDate}
                            max={today}
                            defaultValue={today}
                            required
                          />
                        </Field>
                      </FieldGroup>
                    )}
                    <Button type="submit" disabled={pending}>
                      {pending
                        ? "Saving…"
                        : selected.choice === "cash"
                          ? "Confirm cash received"
                          : "Add dividend to shares"}
                    </Button>
                  </form>
                )}
              </DialogContent>
            )}
          </Dialog>
        </>
      )}
    </div>
  );
}
