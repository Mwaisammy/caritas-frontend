"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  assessCashChargeAction,
  type CashMutationState,
} from "@/app/dashboard/contributions/actions";

// ChargeAssessment keeps creating an obligation separate from paying it.
// Without this form, a cashier would have to treat an unassessed amount as a payable charge.
export function ChargeAssessment({
  memberId,
  onCreated,
}: {
  memberId: string;
  onCreated: () => void;
}) {
  const [category, setCategory] = useState("literature");
  const [submission, setSubmission] = useState<FormData | null>(null);
  const [locked, setLocked] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [restoring, startRestoring] = useTransition();
  useEffect(() => {
    startRestoring(() => {
      try {
        const saved = sessionStorage.getItem(`cash-charge:${memberId}`);
        if (saved) {
          const values: unknown = JSON.parse(saved);
          if (
            !Array.isArray(values) ||
            !values.every(
              (item) =>
                Array.isArray(item) &&
                item.length === 2 &&
                item.every((value) => typeof value === "string"),
            )
          )
            throw new Error("invalid charge");
          const data = new FormData();
          for (const [key, value] of values) data.set(key, value);
          setSubmission(data);
          setLocked(true);
        }
      } catch {
        setStorageError(
          "Charge recovery storage is unavailable. Restore it before assessing another charge.",
        );
      }
    });
  }, [memberId]);
  const [state, action, pending] = useActionState(
    async (previous: CashMutationState, data: FormData) => {
      if (!submission) {
        data.set("idempotencyKey", crypto.randomUUID());
        data.set("memberId", memberId);
        try {
          sessionStorage.setItem(
            `cash-charge:${memberId}`,
            JSON.stringify(Array.from(data.entries())),
          );
        } catch {
          return {
            ok: false as const,
            message: "Enable browser storage before assessing a charge.",
          };
        }
        setSubmission(data);
      }
      let result: CashMutationState;
      try {
        result = await assessCashChargeAction(previous, submission ?? data);
      } catch {
        result = {
          ok: false,
          retry: true,
          message:
            "The charge assessment could not be confirmed. Retry the same details.",
        };
      }
      if (
        result?.ok ||
        (result?.ok === false &&
          !result.retry &&
          (!locked || result.definitive))
      ) {
        try {
          sessionStorage.removeItem(`cash-charge:${memberId}`);
          setSubmission(null);
          setLocked(false);
        } catch {
          setStorageError(
            "Charge recovery storage could not be cleared. Restore it before assessing another charge.",
          );
        }
      } else setLocked(true);
      if (result?.ok) onCreated();
      return result;
    },
    null,
  );
  return (
    <details>
      <summary>Assess a new charge</summary>
      <p className="text-sm text-muted-foreground">
        This creates an obligation with a reason. It does not collect money.
      </p>
      {storageError ? (
        <Alert variant="destructive">
          <AlertDescription>{storageError}</AlertDescription>
        </Alert>
      ) : null}
      <form action={action}>
        <FieldGroup>
          {locked ? (
            <Alert>
              <AlertDescription>
                Retry the saved assessment:{" "}
                {String(submission?.get("category"))}, KES{" "}
                {String(submission?.get("amount"))},{" "}
                {String(submission?.get("reason"))}.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <input type="hidden" name="category" value={category} />
              <Field>
                <FieldTitle id="charge-category">Category</FieldTitle>
                <ToggleGroup
                  aria-labelledby="charge-category"
                  className="flex-wrap"
                  value={[category]}
                  onValueChange={(values) =>
                    values[0] && setCategory(values[0])
                  }
                  variant="outline"
                  disabled={pending}
                >
                  {[
                    "literature",
                    "caritas_registration",
                    "lsf",
                    "laptop",
                    "penalty",
                    "other",
                  ].map((value) => (
                    <ToggleGroupItem key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="chargeAmount">
                  Assessed amount (KES)
                </FieldLabel>
                <Input
                  id="chargeAmount"
                  name="amount"
                  inputMode="decimal"
                  required
                  disabled={pending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="chargeReason">
                  Assessment reason
                </FieldLabel>
                <Input
                  id="chargeReason"
                  name="reason"
                  maxLength={500}
                  required
                  disabled={pending}
                />
              </Field>
            </>
          )}
          {state ? (
            <Alert variant={state.ok ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <Button disabled={pending || restoring || Boolean(storageError)}>
            {locked ? "Retry same assessment" : "Create charge obligation"}
          </Button>
        </FieldGroup>
      </form>
    </details>
  );
}
