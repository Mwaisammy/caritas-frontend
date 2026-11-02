"use client";

import { useState, useTransition } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
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
  const selected = report?.allocations.find(
    (row) => (row.id ?? row.memberId) === selectedId,
  );
  const visible =
    report?.allocations.filter((row) =>
      `${row.name} ${row.memberNumber}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

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
          setMessage(
            operation === "load"
              ? "Register loaded."
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
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dividends</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review annual returns, record member choices and settle dividends in
          cash or shares.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Annual register</CardTitle>
          <CardDescription>
            Returns use the share balance at 31 December. Members need at least
            KSh 100.00 in share contributions in each of the six completed
            months before declaration.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSelectedId("");
            setSearch("");
            submit("load", new FormData(event.currentTarget));
          }}
        >
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="financialYear">Financial year</FieldLabel>
                <Input
                  id="financialYear"
                  name="financialYear"
                  type="number"
                  min="2000"
                  max={Number(today.slice(0, 4)) - 1}
                  defaultValue={Number(today.slice(0, 4)) - 1}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="declarationDate">
                  Declaration date
                </FieldLabel>
                <Input
                  id="declarationDate"
                  name="declarationDate"
                  type="date"
                  value={today}
                  readOnly
                />
                <FieldDescription>
                  Approved years keep their original declaration date.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="rate">Annual rate (%)</FieldLabel>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  min="0.0001"
                  max="100"
                  step="0.0001"
                  defaultValue="5"
                  required
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-4 flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Working…" : "Load register / preview"}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
            className="flex min-w-0 flex-col gap-4"
            aria-label="Distribution summary"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {report.financialYear} distribution
                </h2>
                <Badge variant="outline">
                  {report.status === "approved" ? "Approved" : "Preview"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {Number(report.rate).toLocaleString("en-KE", {
                  maximumFractionDigits: 2,
                })}
                % · {dates.format(new Date(report.declarationDate))}
              </p>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {[
                [
                  report.status === "draft"
                    ? "Proposed total"
                    : "Approved total",
                  report.approvedTotal,
                ],
                ["Cash paid", report.cashPaid ?? "0"],
                ["Added to shares", report.reinvested ?? "0"],
                ["Outstanding", report.outstanding ?? report.approvedTotal],
              ].map(([label, amount]) => (
                <Card key={label} size="sm">
                  <CardHeader>
                    <CardDescription>{label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="break-words text-xl font-semibold tabular-nums">
                      {money(amount)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {report.approvedAt && (
              <p className="break-words text-sm text-muted-foreground">
                Approved {dates.format(new Date(report.approvedAt))} ·
                Resolution {report.resolutionReference}
              </p>
            )}
          </section>

          {report.hasErrors && (
            <Alert variant="destructive">
              <AlertTitle>Historical balances need review</AlertTitle>
              <AlertDescription>
                Resolve negative balances or duplicate share accounts before
                approving this register.
              </AlertDescription>
            </Alert>
          )}

          {report.status === "draft" && report.canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Approve this distribution</CardTitle>
                <CardDescription>
                  Review the member allocations below first. Approval freezes
                  the amounts and eligibility for this year.
                </CardDescription>
              </CardHeader>
              <form
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
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="resolutionReference">
                        Approval / resolution reference
                      </FieldLabel>
                      <Input
                        id="resolutionReference"
                        name="resolutionReference"
                        placeholder="e.g. AGM 2026, minute 8"
                        maxLength={200}
                        required
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="mt-4 flex-col items-stretch sm:flex-row sm:justify-end">
                  <Button type="submit" disabled={pending || report.hasErrors}>
                    {pending ? "Working…" : "Approve reviewed allocations"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <section
            className="flex min-w-0 flex-col gap-4"
            aria-labelledby="members-heading"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="members-heading" className="text-xl font-semibold">
                  Member allocations
                </h2>
                <p className="text-sm text-muted-foreground">
                  {visible.length} of {report.allocations.length} members
                </p>
              </div>
              <Field className="sm:max-w-xs">
                <FieldLabel htmlFor="memberSearch">Find a member</FieldLabel>
                <Input
                  id="memberSearch"
                  type="search"
                  placeholder="Name or member number"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Field>
            </div>
            <div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visible.map((row) => (
                <Card key={row.memberId} className="min-w-0">
                  <CardHeader>
                    <CardTitle>
                      <span className="break-words">
                        {row.name || `Member ${row.memberNumber}`}
                      </span>
                    </CardTitle>
                    <CardDescription>Member {row.memberNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <dl className="grid min-w-0 grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">
                          Year-end shares
                        </dt>
                        <dd className="break-words font-medium tabular-nums">
                          {money(row.shareBalance)}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">
                          Dividend
                        </dt>
                        <dd className="break-words font-semibold tabular-nums">
                          {money(row.amount)}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {row.eligible ? "Eligible" : "Excluded"}
                      </Badge>
                      {row.eligible && (
                        <Badge variant="outline">
                          {row.settledAt
                            ? row.choice === "cash"
                              ? "Cash paid"
                              : "Reinvested"
                            : Number(row.amount) === 0
                              ? "No dividend payable"
                              : report.status === "draft"
                                ? "Proposed"
                                : row.choice
                                  ? "Awaiting settlement"
                                  : "Awaiting choice"}
                        </Badge>
                      )}
                    </div>
                    {!row.eligible && (
                      <p className="text-sm text-muted-foreground">
                        {row.reason}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <form
                      className="w-full"
                      onSubmit={(event) => {
                        event.preventDefault();
                        setSelectedId(row.id ?? row.memberId);
                        setChoice([]);
                        setMessage("");
                        setHasError(false);
                      }}
                    >
                      <Button
                        className="w-full"
                        type="submit"
                        variant="outline"
                        disabled={pending}
                      >
                        {report.status === "approved" &&
                        row.eligible &&
                        !row.settledAt &&
                        Number(row.amount) > 0 &&
                        report.canManage
                          ? "Manage dividend"
                          : "View details"}
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {visible.length === 0 && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No members found</EmptyTitle>
                  <EmptyDescription>
                    {search
                      ? "Try another name or member number."
                      : "There are no member records in this register."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
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
                      Year-end shares
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
