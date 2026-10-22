"use client";

import { CurrencyInput } from "@/components/currency-input";
import { useEffect, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import type { DarajaPayment } from "@/lib/go-api-client";
import {
  loadDarajaRecoveryAction,
  recoverDarajaAction,
} from "@/app/dashboard/contributions/recovery-actions";
import { formatMoney } from "./contribution-utils";

// DarajaRecovery keeps missing callbacks and failed postings visible across browser sessions.
// Without it, staff must ask members to pay again or inspect database rows manually.
export function DarajaRecovery() {
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof loadDarajaRecoveryAction>
  > | null>(null);
  const [selected, setSelected] = useState<DarajaPayment | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let active = true;
    loadDarajaRecoveryAction().then((value) => {
      if (active) setResult(value);
    });
    return () => {
      active = false;
    };
  }, []);

  // refresh replaces the current page; keeping it avoids accidentally duplicating cursor results.
  const refresh = (token = "") =>
    start(async () => {
      setResult(await loadDarajaRecoveryAction(token));
    });

  // recover preserves the original request identity so every action remains a recovery, never a new charge.
  const recover = (data: FormData) =>
    start(async () => {
      const outcome = await recoverDarajaAction(data);
      setFeedback(outcome);
      if (outcome.ok) {
        setSelected(null);
        setResult(await loadDarajaRecoveryAction());
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>M-Pesa recovery</CardTitle>
        <CardDescription>
          Find unresolved payments, check M-Pesa, or reconcile money already
          received.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {feedback ? (
          <Alert variant={feedback.ok ? "default" : "destructive"}>
            <AlertTitle>Recovery update</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        ) : null}
        {!result ? (
          <Spinner />
        ) : !result.ok ? (
          <Alert variant="destructive">
            <AlertTitle>Recovery unavailable</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : (
          <>
            {!result.payments.length ? (
              <p className="text-muted-foreground">
                No unresolved M-Pesa payments in this branch.
              </p>
            ) : null}
            {result.payments.map((payment) => (
              <Card key={payment.paymentRequestId} size="sm">
                <CardHeader>
                  <CardTitle>{formatMoney(payment.amount)}</CardTitle>
                  <CardDescription className="break-all">
                    Request {payment.paymentRequestId} · Member{" "}
                    {payment.memberId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Badge variant="secondary">
                    {(
                      payment.receiptStatus ||
                      payment.recoveryStatus ||
                      payment.status
                    ).replaceAll("_", " ")}
                  </Badge>
                  <p className="break-all text-sm">
                    Checkout:{" "}
                    {payment.checkoutRequestId ||
                      "Unconfirmed initiation — business records required"}
                  </p>
                  {payment.mpesaReference ? (
                    <p>M-Pesa reference: {payment.mpesaReference}</p>
                  ) : null}
                  {payment.providerResult ? (
                    <p className="text-sm text-muted-foreground">
                      {payment.providerResult}
                    </p>
                  ) : null}
                  {payment.lastError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Posting needs review</AlertTitle>
                      <AlertDescription>{payment.lastError}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={
                      pending ||
                      !payment.checkoutRequestId ||
                      payment.status !== "pending"
                    }
                    onClick={() => {
                      const data = new FormData();
                      data.set("paymentRequestId", payment.paymentRequestId);
                      data.set("action", "query");
                      recover(data);
                    }}
                  >
                    Check with M-Pesa
                  </Button>
                  {result.context.canApprove ? (
                    <Button
                      disabled={pending}
                      onClick={() => {
                        setFeedback(null);
                        setSelected(payment);
                      }}
                    >
                      {payment.receiptStatus
                        ? "Review posting"
                        : "Reconcile received payment"}
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            ))}
          </>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" disabled={pending} onClick={() => refresh()}>
          {pending ? <Spinner data-icon="inline-start" /> : null}Refresh
          recovery
        </Button>
        {result?.ok && result.nextPageToken ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => refresh(result.nextPageToken)}
          >
            Older payments
          </Button>
        ) : null}
      </CardFooter>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!pending && !open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected?.receiptStatus
                ? "Retry contribution posting"
                : "Reconcile verified M-Pesa payment"}
            </DialogTitle>
            <DialogDescription>
              {selected?.receiptStatus
                ? "Retry the saved allocation after resolving the reported issue."
                : "Verify this payment against the SACCO M-Pesa business statement. An SMS or screenshot alone is insufficient."}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <form action={recover}>
              <input
                type="hidden"
                name="paymentRequestId"
                value={selected.paymentRequestId}
              />
              <input
                type="hidden"
                name="action"
                value={selected.receiptStatus ? "retry_posting" : "reconcile"}
              />
              <FieldGroup>
                {!selected.receiptStatus ? (
                  <>
                    {!selected.checkoutRequestId ? (
                      <Field>
                        <FieldLabel htmlFor="recovery-checkout">
                          Verified checkout request ID
                        </FieldLabel>
                        <Input
                          id="recovery-checkout"
                          name="checkoutRequestId"
                          required
                        />
                      </Field>
                    ) : null}
                    <Field>
                      <FieldLabel htmlFor="recovery-reference">
                        Verified M-Pesa receipt number
                      </FieldLabel>
                      <Input
                        id="recovery-reference"
                        name="mpesaReference"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="recovery-amount">
                        Received amount (KES)
                      </FieldLabel>
                      <CurrencyInput
                        id="recovery-amount"
                        name="amount"
                        inputMode="decimal"
                        required
                      />
                      <FieldDescription>
                        Must match this request’s expected amount. Differences
                        require investigation.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="recovery-time">
                        Payment date and time (Nairobi)
                      </FieldLabel>
                      <Input
                        id="recovery-time"
                        name="paymentTime"
                        type="datetime-local"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="recovery-evidence">
                        Business statement or verification reference
                      </FieldLabel>
                      <Textarea
                        id="recovery-evidence"
                        name="evidence"
                        required
                      />
                    </Field>
                  </>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="recovery-reason">Reason</FieldLabel>
                  <Textarea id="recovery-reason" name="reason" required />
                </Field>
                <Button
                  disabled={pending}
                  type="submit"
                  formAction={(data) => {
                    const stamp = String(data.get("paymentTime") ?? "");
                    if (stamp) data.set("receivedAt", `${stamp}:00+03:00`);
                    data.delete("paymentTime");
                    recover(data);
                  }}
                >
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {selected.receiptStatus
                    ? "Retry posting existing payment"
                    : "Save verified reconciliation"}
                </Button>
              </FieldGroup>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
