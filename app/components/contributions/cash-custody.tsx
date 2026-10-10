"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CheckCircle2Icon, LandmarkIcon, RefreshCwIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  FieldContent,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { CashierSession, CashDeposit } from "@/lib/go-api-client";
import { cn } from "@/lib/utils";

import {
  loadCashCustodyAction,
  cashCustodyAction,
  type CashMutationState,
} from "@/app/dashboard/contributions/actions";
import {
  formatMoney,
  formatMinorUnits,
  minorUnits,
  moneyDecimal,
} from "./contribution-utils";
// Staff names are authoritative; short references distinguish any missing names.
function staffLabel(name: string | undefined, id: string | undefined) {
  return (
    name?.trim() || (id ? `Staff · ${id.slice(0, 8)}` : "Name unavailable")
  );
}

// Custody timestamps use Nairobi time consistently and tolerate missing audit dates.
function custodyDate(value: string | undefined) {
  return value
    ? new Date(value).toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not recorded";
}

// CashCustody provides the separate custody workbench; removing it leaves collection without bank reconciliation.
export function CashCustody() {
  const [workspace, setWorkspace] = useState<Awaited<
    ReturnType<typeof loadCashCustodyAction>
  > | null>(null);
  const [loading, startLoading] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [depositSubmission, setDepositSubmission] = useState<FormData | null>(
    null,
  );
  const [lockedDeposit, setLockedDeposit] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [activeOperation, setActiveOperation] = useState("");
  const [handover, setHandover] = useState<CashierSession | null>(null);
  const [details, setDetails] = useState<CashDeposit | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const staffId = workspace?.ok ? workspace.context.staffId : undefined;
  useEffect(() => {
    let active = true;
    startLoading(async () => {
      const result = await loadCashCustodyAction().catch(() => ({
        ok: false as const,
        message: "Cash custody could not load. Use Refresh to try again.",
      }));
      if (active) setWorkspace(result);
    });
    return () => {
      active = false;
    };
  }, []);

  // Restore after staff context becomes available, including a successful retry of an initial load failure.
  useEffect(() => {
    if (!staffId) return;
    startLoading(async () => {
      try {
        const saved = sessionStorage.getItem(`cash-deposit:${staffId}`);
        if (!saved) return;
        const values: unknown = JSON.parse(saved);
        if (
          !Array.isArray(values) ||
          !values.every(
            (item) =>
              Array.isArray(item) &&
              item.length === 2 &&
              item.every((value) => typeof value === "string"),
          )
        ) {
          throw new Error("invalid deposit");
        }
        const data = new FormData();
        for (const [key, value] of values) data.append(key, value);
        setDepositSubmission(data);
        setLockedDeposit(true);
      } catch {
        setStorageError(
          "Saved deposit could not be read. Restore browser storage before recording a deposit.",
        );
      }
    });
  }, [staffId]);

  const [state, action, pending] = useActionState(
    async (previous: CashMutationState, data: FormData) => {
      if (!workspace?.ok)
        return { ok: false as const, message: "Reload cash custody first." };
      const operation = String(data.get("operation"));
      setActiveOperation(
        `${operation}:${data.get("sessionId") ?? data.get("depositId") ?? ""}`,
      );
      const deposit = operation === "deposit";
      if (operation === "details") {
        setDetailsLoading(true);
        setDetailsError("");
      }
      if (deposit && !depositSubmission) {
        try {
          sessionStorage.setItem(
            `cash-deposit:${workspace.context.staffId}`,
            JSON.stringify(Array.from(data.entries())),
          );
        } catch {
          return {
            ok: false as const,
            message: "Enable browser storage before recording a deposit.",
          };
        }
        setDepositSubmission(data);
      }
      let result: CashMutationState;
      try {
        result = await cashCustodyAction(
          previous,
          deposit ? (depositSubmission ?? data) : data,
        );
      } catch {
        result = {
          ok: false,
          retry: true,
          message:
            "The cash operation could not be confirmed. Retry the same details.",
        };
      }
      if (operation === "details") {
        setDetailsLoading(false);
        if (result?.ok && result.deposit) setDetails(result.deposit);
        else
          setDetailsError(result?.message ?? "Deposit details could not load.");
      }
      if (deposit) {
        if (
          result?.ok ||
          (result?.ok === false &&
            !result.retry &&
            (!lockedDeposit || result.definitive))
        ) {
          try {
            sessionStorage.removeItem(
              `cash-deposit:${workspace.context.staffId}`,
            );
            setDepositSubmission(null);
            setLockedDeposit(false);
            setRecoveryOpen(false);
          } catch {
            setStorageError(
              "Deposit recovery storage could not be cleared. Restore it before recording another deposit.",
            );
          }
        } else {
          setLockedDeposit(true);
          setRecoveryOpen(true);
        }
      }
      if (result?.ok && data.get("operation") !== "details") {
        setSelected([]);
        const refreshed = await loadCashCustodyAction().catch(() => ({
          ok: false as const,
          message: "Cash custody could not load. Use Refresh to try again.",
        }));
        setHandover(null);
        if (refreshed.ok) {
          setWorkspace(refreshed);
          setLoadError("");
        } else
          setLoadError(
            "The operation succeeded, but custody could not refresh. Refresh before taking another action.",
          );
      }
      return result;
    },
    null,
  );
  const current = workspace?.ok ? workspace : undefined;
  const total =
    current?.sessions
      .filter((session) => selected.includes(session.id))
      .reduce(
        (sum, session) =>
          sum + minorUnits(moneyDecimal(session.countedAmount!)),
        0,
      ) ?? 0;
  const awaiting =
    current?.sessions.filter((session) => session.status === "closed") ?? [];
  const ready =
    current?.sessions.filter(
      (session) => session.status === "handed_over" && session.countedAmount,
    ) ?? [];
  const depositErrors =
    activeOperation === "deposit:" && state?.ok === false
      ? state.fieldErrors
      : undefined;
  const refreshNeeded = Boolean(loadError);
  return (
    <section
      className="flex flex-col gap-6 print:hidden"
      aria-label="Cash custody"
      aria-busy={loading}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Cash custody</h2>
          <p className="text-sm text-muted-foreground">
            Accept counted cash, record its bank deposit, then verify the
            evidence.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={loading || pending}
          onClick={() =>
            startLoading(async () => {
              const result = await loadCashCustodyAction().catch(() => ({
                ok: false as const,
                message:
                  "Cash custody could not load. Use Refresh to try again.",
              }));
              if (result.ok) {
                setWorkspace(result);
                setLoadError("");
                setSelected([]);
              } else setLoadError(result.message);
            })
          }
        >
          {loading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RefreshCwIcon data-icon="inline-start" />
          )}
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {!workspace && !loadError ? (
        <div
          className="grid gap-6 lg:grid-cols-2"
          role="status"
          aria-label="Loading cash custody"
        >
          {[0, 1].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {[0, 1].map((row) => (
                  <div className="flex flex-col gap-2" key={row}>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          <span className="sr-only">Loading cash custody…</span>
        </div>
      ) : null}
      {workspace?.ok === false || loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Custody could not refresh</AlertTitle>
          <AlertDescription>
            {loadError || (workspace?.ok === false ? workspace.message : "")}{" "}
            Use Refresh to try again.
          </AlertDescription>
        </Alert>
      ) : null}
      {storageError ? (
        <Alert variant="destructive">
          <AlertTitle>Deposit recovery needs attention</AlertTitle>
          <AlertDescription>{storageError}</AlertDescription>
        </Alert>
      ) : null}
      {state && !pending && !activeOperation.startsWith("details:") ? (
        <Alert variant={state.ok ? "default" : "destructive"}>
          <AlertTitle>
            {state.ok
              ? "Custody updated"
              : state.retry
                ? "Operation needs confirmation"
                : "Operation could not complete"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {current ? (
        <>
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>1. Awaiting handover</CardTitle>
                <CardDescription>
                  Check the physical cash against the count before accepting
                  responsibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {awaiting.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CheckCircle2Icon />
                      </EmptyMedia>
                      <EmptyTitle>No tills awaiting handover</EmptyTitle>
                      <EmptyDescription>
                        Closed tills appear here once the cashier has counted
                        the cash.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  awaiting.map((session) => (
                    <div
                      className="flex flex-col gap-4 rounded-lg border p-4"
                      key={session.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <h3 className="font-medium">
                            {staffLabel(session.cashierName, session.cashierId)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Closed {custodyDate(session.closedAt)} · Till{" "}
                            {session.id.slice(0, 8)}
                          </p>
                        </div>
                        <Badge variant="secondary">Awaiting handover</Badge>
                      </div>
                      <dl className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Expected
                          </dt>
                          <dd className="mt-1 tabular-nums">
                            {formatMoney(session.expectedAmount)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Counted cash
                          </dt>
                          <dd className="mt-1 font-semibold tabular-nums">
                            {formatMoney(session.countedAmount)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Variance
                          </dt>
                          <dd
                            className={cn(
                              "mt-1 tabular-nums",
                              session.variance &&
                                Number(moneyDecimal(session.variance)) !== 0 &&
                                "text-destructive",
                            )}
                          >
                            {session.variance &&
                            Number(moneyDecimal(session.variance)) !== 0
                              ? `${Number(moneyDecimal(session.variance)) < 0 ? "Short" : "Excess"} · ${formatMoney(session.variance)}`
                              : "Balanced"}
                          </dd>
                        </div>
                      </dl>
                      {session.varianceReason ? (
                        <p className="text-sm text-muted-foreground">
                          Reason: {session.varianceReason}
                        </p>
                      ) : null}
                      {current.context.canApprove &&
                      session.cashierId !== current.context.staffId ? (
                        <Button
                          className="self-start"
                          disabled={pending || loading || refreshNeeded}
                          onClick={() => setHandover(session)}
                        >
                          Accept handover
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {session.cashierId === current.context.staffId
                            ? "Another authorized staff member must accept your cash."
                            : "An authorized staff member must accept this handover."}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2. Ready for deposit</CardTitle>
                <CardDescription>
                  Select accepted tills. The actual bank deposit must equal
                  their counted cash.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lockedDeposit ? (
                  <form action={action} className="flex flex-col gap-4">
                    <input type="hidden" name="operation" value="deposit" />
                    <Alert>
                      <AlertTitle>
                        Previous deposit needs confirmation
                      </AlertTitle>
                      <AlertDescription>
                        Reference:{" "}
                        {String(depositSubmission?.get("bankReference") ?? "")}{" "}
                        · {String(depositSubmission?.get("amount") ?? "")} KES.
                        Retry these saved details before recording another
                        deposit.
                      </AlertDescription>
                    </Alert>
                    <Button
                      type="submit"
                      disabled={
                        pending ||
                        loading ||
                        refreshNeeded ||
                        Boolean(storageError)
                      }
                    >
                      {pending && activeOperation === "deposit:" ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      Retry same deposit
                    </Button>
                  </form>
                ) : ready.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <LandmarkIcon />
                      </EmptyMedia>
                      <EmptyTitle>No cash ready for deposit</EmptyTitle>
                      <EmptyDescription>
                        Accept a closed till first. Its counted cash will then
                        be available here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : current.context.canApprove ? (
                  <form action={action}>
                    <input type="hidden" name="operation" value="deposit" />
                    <FieldGroup>
                      <FieldSet>
                        <FieldLegend>Select tills</FieldLegend>
                        {ready.map((session) => (
                          <Field
                            orientation="horizontal"
                            className="rounded-lg border p-3"
                            key={session.id}
                          >
                            <Checkbox
                              id={`deposit-${session.id}`}
                              name="sessionIds"
                              value={session.id}
                              checked={selected.includes(session.id)}
                              disabled={pending || loading || refreshNeeded}
                              onCheckedChange={(checked) =>
                                setSelected((ids) =>
                                  checked
                                    ? [...ids, session.id]
                                    : ids.filter((id) => id !== session.id),
                                )
                              }
                            />
                            <FieldContent>
                              <FieldLabel htmlFor={`deposit-${session.id}`}>
                                {staffLabel(
                                  session.cashierName,
                                  session.cashierId,
                                )}
                              </FieldLabel>
                              <FieldDescription>
                                Till {session.id.slice(0, 8)} · Accepted by{" "}
                                {staffLabel(
                                  session.handedOverToName,
                                  session.handedOverTo,
                                )}
                              </FieldDescription>
                            </FieldContent>
                            <span className="shrink-0 text-sm font-medium tabular-nums">
                              {formatMoney(session.countedAmount)}
                            </span>
                          </Field>
                        ))}
                      </FieldSet>
                      <div
                        className="sticky top-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted p-4"
                        aria-live="polite"
                      >
                        <span className="text-sm text-muted-foreground">
                          {selected.length}{" "}
                          {selected.length === 1 ? "till" : "tills"} selected
                        </span>
                        <span className="text-lg font-semibold tabular-nums">
                          {formatMinorUnits(total)}
                        </span>
                      </div>
                      <Field data-invalid={Boolean(depositErrors?.amount)}>
                        <FieldLabel htmlFor="depositAmount">
                          Actual bank deposit (KES)
                        </FieldLabel>
                        <Input
                          id="depositAmount"
                          name="amount"
                          inputMode="decimal"
                          required
                          disabled={pending || loading || refreshNeeded}
                          aria-invalid={Boolean(depositErrors?.amount)}
                        />
                        <FieldError>{depositErrors?.amount?.[0]}</FieldError>
                      </Field>
                      <Field
                        data-invalid={Boolean(depositErrors?.bankReference)}
                      >
                        <FieldLabel htmlFor="bankReference">
                          Bank reference
                        </FieldLabel>
                        <Input
                          id="bankReference"
                          name="bankReference"
                          required
                          maxLength={200}
                          disabled={pending || loading || refreshNeeded}
                          aria-invalid={Boolean(depositErrors?.bankReference)}
                        />
                        <FieldDescription>
                          Use the reference on the bank evidence. Keep the
                          evidence for independent verification.
                        </FieldDescription>
                        <FieldError>
                          {depositErrors?.bankReference?.[0]}
                        </FieldError>
                      </Field>
                      <Button
                        type="submit"
                        disabled={
                          pending ||
                          loading ||
                          refreshNeeded ||
                          selected.length === 0 ||
                          Boolean(storageError)
                        }
                      >
                        {pending && activeOperation === "deposit:" ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        {pending && activeOperation === "deposit:"
                          ? "Recording deposit…"
                          : "Record bank deposit"}
                      </Button>
                    </FieldGroup>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3">
                    {ready.map((session) => (
                      <div
                        className="flex flex-wrap justify-between gap-2 rounded-lg border p-4"
                        key={session.id}
                      >
                        <span className="font-medium">
                          {staffLabel(session.cashierName, session.cashierId)}
                        </span>
                        <span className="tabular-nums">
                          {formatMoney(session.countedAmount)}
                        </span>
                      </div>
                    ))}
                    <p className="text-sm text-muted-foreground">
                      An authorized staff member records the bank deposit.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>3. Bank evidence</CardTitle>
              <CardDescription>
                Verify bank evidence independently. The recorder cannot verify
                their own deposit.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {["recorded", "verified"].map((status) => {
                const deposits = current.deposits.filter(
                  (deposit) => deposit.status === status,
                );
                return (
                  <div className="flex flex-col gap-3" key={status}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">
                        {status === "recorded"
                          ? "Awaiting verification"
                          : "Verified deposits"}
                      </h3>
                      <Badge variant="outline">
                        {deposits.length}
                        {current.depositToken ? " loaded" : ""}
                      </Badge>
                    </div>
                    {deposits.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            {status === "recorded" ? (
                              <CheckCircle2Icon />
                            ) : (
                              <LandmarkIcon />
                            )}
                          </EmptyMedia>
                          <EmptyTitle>
                            {status === "recorded"
                              ? "No deposits awaiting verification"
                              : "No verified deposits yet"}
                          </EmptyTitle>
                          <EmptyDescription>
                            {status === "recorded"
                              ? "Recorded bank deposits appear here for an independent check."
                              : "Completed bank checks will appear here."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      deposits.map((deposit) => (
                        <div
                          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                          key={deposit.id}
                        >
                          <div className="flex min-w-0 flex-col gap-1">
                            <h4 className="break-words font-medium">
                              {deposit.bankReference}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Recorded by{" "}
                              {staffLabel(
                                deposit.recordedByName,
                                deposit.recordedBy,
                              )}{" "}
                              · {custodyDate(deposit.recordedAt)}
                            </p>
                            {deposit.status === "verified" ? (
                              <p className="text-sm text-muted-foreground">
                                Verified by{" "}
                                {staffLabel(
                                  deposit.verifiedByName,
                                  deposit.verifiedBy,
                                )}{" "}
                                · {custodyDate(deposit.verifiedAt)}
                              </p>
                            ) : null}
                            {deposit.status === "recorded" &&
                            deposit.recordedBy === current.context.staffId ? (
                              <p className="text-xs text-muted-foreground">
                                Another authorized staff member must verify this
                                deposit.
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold tabular-nums">
                              {formatMoney(deposit.amount)}
                            </span>
                            <form
                              action={action}
                              onSubmit={() => {
                                setDetails(deposit);
                                setDetailsLoading(true);
                                setDetailsError("");
                              }}
                            >
                              <input
                                type="hidden"
                                name="operation"
                                value="details"
                              />
                              <input
                                type="hidden"
                                name="depositId"
                                value={deposit.id}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                disabled={pending || loading || refreshNeeded}
                              >
                                View details
                              </Button>
                            </form>
                            {current.context.canApprove &&
                            deposit.status === "recorded" &&
                            deposit.recordedBy !== current.context.staffId ? (
                              <form action={action}>
                                <input
                                  type="hidden"
                                  name="operation"
                                  value="verify"
                                />
                                <input
                                  type="hidden"
                                  name="depositId"
                                  value={deposit.id}
                                />
                                <Button
                                  type="submit"
                                  disabled={pending || loading || refreshNeeded}
                                >
                                  {pending &&
                                  activeOperation === `verify:${deposit.id}` ? (
                                    <Spinner data-icon="inline-start" />
                                  ) : null}
                                  {pending &&
                                  activeOperation === `verify:${deposit.id}`
                                    ? "Verifying…"
                                    : "Verify bank evidence"}
                                </Button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
              {current.depositToken ? (
                <Button
                  variant="outline"
                  className="self-start"
                  disabled={loading || pending}
                  onClick={() =>
                    startLoading(async () => {
                      const result = await loadCashCustodyAction(
                        "",
                        current.depositToken,
                      ).catch(() => ({
                        ok: false as const,
                        message: "Older deposits could not load. Try again.",
                      }));
                      if (result.ok) {
                        setWorkspace({
                          ...result,
                          sessions: current.sessions,
                          sessionToken: current.sessionToken,
                          deposits: [...current.deposits, ...result.deposits],
                        });
                        setLoadError("");
                      } else setLoadError(result.message);
                    })
                  }
                >
                  Load more deposits
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <details className="rounded-xl border p-5">
            <summary className="cursor-pointer text-sm font-medium">
              Till activity and references
            </summary>
            <div className="mt-5 flex flex-col gap-4">
              {current.sessions.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No till activity yet</EmptyTitle>
                    <EmptyDescription>
                      Open a cashier till to begin collecting cash.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}
              {current.sessions.map((session) => (
                <div
                  className="flex flex-col gap-3 rounded-lg border p-4"
                  key={session.id}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-medium">
                      {staffLabel(session.cashierName, session.cashierId)}
                    </h3>
                    <Badge variant="outline">
                      {
                        {
                          open: "Collecting cash",
                          closed: "Awaiting handover",
                          handed_over: "Ready for deposit",
                          deposited: "Deposited",
                        }[session.status]
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expected {formatMoney(session.expectedAmount)} · Counted{" "}
                    {session.countedAmount
                      ? formatMoney(session.countedAmount)
                      : "Not counted"}
                  </p>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Opened</dt>
                      <dd>{custodyDate(session.openedAt)}</dd>
                    </div>
                    {session.closedAt ? (
                      <div>
                        <dt className="text-muted-foreground">Closed</dt>
                        <dd>{custodyDate(session.closedAt)}</dd>
                      </div>
                    ) : null}
                    {session.handedOverTo ? (
                      <div>
                        <dt className="text-muted-foreground">
                          Accepted by{" "}
                          {staffLabel(
                            session.handedOverToName,
                            session.handedOverTo,
                          )}
                        </dt>
                        <dd>{custodyDate(session.handedOverAt)}</dd>
                      </div>
                    ) : null}
                    {session.depositedAt ? (
                      <div>
                        <dt className="text-muted-foreground">Deposited</dt>
                        <dd>{custodyDate(session.depositedAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="break-all text-xs text-muted-foreground">
                    Till reference: {session.id}
                  </p>
                </div>
              ))}
            </div>
          </details>
          {current.sessionToken ? (
            <Button
              variant="outline"
              className="self-start"
              disabled={loading || pending}
              onClick={() =>
                startLoading(async () => {
                  const result = await loadCashCustodyAction(
                    current.sessionToken,
                    "",
                  ).catch(() => ({
                    ok: false as const,
                    message: "Older tills could not load. Try again.",
                  }));
                  if (result.ok) {
                    setWorkspace({
                      ...result,
                      sessions: [...current.sessions, ...result.sessions],
                      deposits: current.deposits,
                      depositToken: current.depositToken,
                    });
                    setLoadError("");
                  } else setLoadError(result.message);
                })
              }
            >
              Load more tills
            </Button>
          ) : null}
          {current.sessionToken || current.depositToken ? (
            <p className="text-xs text-muted-foreground">
              Showing loaded records. Load more tills or deposits to view older
              activity.
            </p>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={Boolean(handover)}
        onOpenChange={(open) => {
          if (!open && !pending) setHandover(null);
        }}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Accept cash handover</DialogTitle>
            <DialogDescription>
              Confirm you have received the physical cash from{" "}
              {staffLabel(handover?.cashierName, handover?.cashierId)}.
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Counted cash</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(handover?.countedAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Variance</dt>
              <dd className="mt-1 tabular-nums">
                {formatMoney(handover?.variance)}
              </dd>
            </div>
          </dl>
          {handover?.varianceReason ? (
            <p className="text-sm text-muted-foreground">
              Reason: {handover.varianceReason}
            </p>
          ) : null}
          {state?.ok === false &&
          activeOperation === `handover:${handover?.id}` ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setHandover(null)}
            >
              Cancel
            </Button>
            <form action={action}>
              <input type="hidden" name="operation" value="handover" />
              <input
                type="hidden"
                name="sessionId"
                value={handover?.id ?? ""}
              />
              <Button
                type="submit"
                disabled={pending || loading || refreshNeeded}
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Accepting…" : "Confirm handover"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(details)}
        onOpenChange={(open) => {
          if (!open && !detailsLoading) setDetails(null);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          showCloseButton={!detailsLoading}
        >
          <DialogHeader>
            <DialogTitle>Bank deposit details</DialogTitle>
            <DialogDescription>{details?.bankReference}</DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex flex-col gap-3" role="status">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <span className="sr-only">Loading deposit details…</span>
            </div>
          ) : detailsError ? (
            <Alert variant="destructive">
              <AlertTitle>Details could not load</AlertTitle>
              <AlertDescription>
                {detailsError} Close this dialog and select View details to
                retry.
              </AlertDescription>
            </Alert>
          ) : details ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-semibold tabular-nums">
                  {formatMoney(details.amount)}
                </p>
                <Badge variant="outline">
                  {details.status === "verified"
                    ? "Verified"
                    : "Awaiting verification"}
                </Badge>
              </div>
              <dl className="flex flex-col gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Recorded by</dt>
                  <dd>
                    {staffLabel(details.recordedByName, details.recordedBy)} ·{" "}
                    {custodyDate(details.recordedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Verified by</dt>
                  <dd>
                    {details.verifiedBy
                      ? `${staffLabel(details.verifiedByName, details.verifiedBy)} · ${custodyDate(details.verifiedAt)}`
                      : "Awaiting independent verification"}
                  </dd>
                </div>
              </dl>
              <Separator />
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Included tills</h3>
                {details.sessionIds?.length ? (
                  details.sessionIds.map((id) => {
                    const session = current?.sessions.find(
                      (item) => item.id === id,
                    );
                    return (
                      <div className="flex flex-col gap-1 text-sm" key={id}>
                        <p className="font-medium">
                          {session
                            ? staffLabel(session.cashierName, session.cashierId)
                            : `Till · ${id.slice(0, 8)}`}
                          {session?.countedAmount
                            ? ` · ${formatMoney(session.countedAmount)}`
                            : ""}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          Till reference: {id}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No linked tills returned.
                  </p>
                )}
              </div>
              <p className="break-all text-xs text-muted-foreground">
                Deposit reference: {details.id}
              </p>
            </>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={detailsLoading}
              onClick={() => setDetails(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={recoveryOpen && lockedDeposit}
        onOpenChange={setRecoveryOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm the previous deposit</DialogTitle>
            <DialogDescription>
              The result is uncertain. Retry the saved reference and amount to
              confirm the original deposit.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTitle>
              {String(depositSubmission?.get("bankReference") ?? "")}
            </AlertTitle>
            <AlertDescription>
              {String(depositSubmission?.get("amount") ?? "")} KES. Another
              deposit is blocked until this one is resolved.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setRecoveryOpen(false)}
            >
              Review custody
            </Button>
            <form action={action}>
              <input type="hidden" name="operation" value="deposit" />
              <Button
                type="submit"
                disabled={
                  pending || loading || refreshNeeded || Boolean(storageError)
                }
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}Retry
                saved deposit
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
