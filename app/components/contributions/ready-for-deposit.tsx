"use client";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { LandmarkIcon } from "lucide-react";
import type { CashierSession } from "@/lib/go-api-client";
import { staffLabel, formatMoney, formatMinorUnits, minorUnits, moneyDecimal } from "./contribution-utils";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { cashCustodyAction, type CashMutationState } from "@/app/dashboard/contributions/actions";

// Owns saved submissions with the form; staying mounted preserves uncertain deposits across stage changes.
export function ReadyForDeposit({
  ready,
  context,
  visible,
  disabled: blocked,
  onBusyChange,
  onSuccess,
}: {
  ready: CashierSession[];
  context: { staffId: string; canApprove: boolean };
  visible: boolean;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [depositSubmission, setDepositSubmission] = useState<FormData | null>(null);
  const [lockedDeposit, setLockedDeposit] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [restoring, startRestoring] = useTransition();
  const staffId = context.staffId;
  // Restore after staff context becomes available, including a successful retry of an initial load failure.
  useEffect(() => {
    if (!staffId) return;
    startRestoring(async () => {
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

  const [state, action, pending] = useActionState(async (previous: CashMutationState, data: FormData) => {
    onBusyChange(true);
    try {
      if (!depositSubmission) {
        try {
          sessionStorage.setItem(
            `cash-deposit:${context.staffId}`,
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
          depositSubmission ?? data,
        );
      } catch {
        result = {
          ok: false,
          retry: true,
          message:
            "The cash operation could not be confirmed. Retry the same details.",
        };
      }
      if (
        result?.ok ||
        (result?.ok === false &&
          !result.retry &&
          (!lockedDeposit || result.definitive))
      ) {
        try {
          sessionStorage.removeItem(
            `cash-deposit:${context.staffId}`,
          );
          setDepositSubmission(null);
          setLockedDeposit(false);
        } catch {
          setStorageError(
            "Deposit recovery storage could not be cleared. Restore it before recording another deposit.",
          );
        }
      } else {
        setLockedDeposit(true);
      }

      if (result?.ok) {
        setSelected([]);
        await onSuccess();
      }
      return result;
    } finally { onBusyChange(false); }
  }, null);
  const disabled = blocked || pending || restoring;
  const chosen = ready.filter((session) => selected.includes(session.id));
  const total = chosen.reduce((sum, session) => sum + minorUnits(moneyDecimal(session.countedAmount!)), 0);
  const depositErrors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <>
      {storageError ? <Alert variant="destructive">
        <AlertTitle>Deposit recovery needs attention</AlertTitle>
        <AlertDescription>{storageError}</AlertDescription>
      </Alert> : null}
      {lockedDeposit && !visible ? <Alert>
        <AlertTitle>Previous deposit needs confirmation</AlertTitle>
        <AlertDescription>Open Deposit to retry the saved bank reference before recording another deposit.</AlertDescription>
      </Alert> : null}
      <div hidden={!visible}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Ready for deposit</h3>
            <Badge variant="ready">{ready.length} accepted tills</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Select accepted tills. The bank deposit must equal their counted cash.</p>
          {state && !pending ? <Alert variant={state.ok ? "default" : "destructive"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert> : null}
          {lockedDeposit ? (
            <form action={action} className="flex flex-col gap-4">
              <input
                type="hidden"
                name="operation"
                value="deposit"
              />
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
                  disabled ||
                  Boolean(storageError)
                }
                variant="brand"
              >
                {pending ? (
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
          ) : context.canApprove ? (
            <form action={action}>
              <input
                type="hidden"
                name="operation"
                value="deposit"
              />
              <FieldGroup className="lg:grid lg:grid-cols-2 lg:items-start">
                <FieldSet className="min-w-0 gap-0 divide-y lg:row-span-4">
                  <FieldLegend>Select tills</FieldLegend>
                  {ready.map((session) => (
                    <Field
                      orientation="horizontal"
                      data-disabled={disabled}
                      className="py-3"
                      key={session.id}
                    >
                      <Checkbox
                        id={`deposit-${session.id}`}
                        name="sessionIds"
                        value={session.id}
                        checked={selected.includes(session.id)}
                        disabled={disabled}
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted p-4"
                  aria-live="polite"
                >
                  <span className="text-sm text-muted-foreground">
                    {chosen.length}{" "}
                    {chosen.length === 1 ? "till" : "tills"} selected
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMinorUnits(total)}
                  </span>
                </div>
                <Field data-invalid={Boolean(depositErrors?.amount)} data-disabled={disabled}>
                  <FieldLabel htmlFor="depositAmount">
                    Actual bank deposit (KES)
                  </FieldLabel>
                  <Input
                    id="depositAmount"
                    name="amount"
                    inputMode="decimal"
                    required
                    disabled={disabled}
                    aria-invalid={Boolean(depositErrors?.amount)}
                  />
                  <FieldError>{depositErrors?.amount?.[0]}</FieldError>
                </Field>
                <Field
                  data-invalid={Boolean(depositErrors?.bankReference)}
                  data-disabled={disabled}
                >
                  <FieldLabel htmlFor="bankReference">
                    Bank reference
                  </FieldLabel>
                  <Input
                    id="bankReference"
                    name="bankReference"
                    required
                    maxLength={200}
                    disabled={disabled}
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
                    disabled ||
                    chosen.length === 0 ||
                    Boolean(storageError)
                  }
                  variant="brand"
                >
                  {pending ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {pending
                    ? "Recording deposit…"
                    : "Record bank deposit"}
                </Button>
              </FieldGroup>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              {ready.map((session) => (
                <div
                  className="flex flex-wrap justify-between gap-2 py-3"
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

        </div>
      </div>
    </>
  );
}
