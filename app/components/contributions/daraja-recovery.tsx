"use client";

import { CurrencyInput } from "@/components/currency-input";
import { format } from "date-fns";
import { CalendarDaysIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
export function DarajaRecovery({ active }: { active: boolean }) {
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof loadDarajaRecoveryAction>
  > | null>(null);
  const [selected, setSelected] = useState<DarajaPayment | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [pending, start] = useTransition();
  const [now, setNow] = useState<number | null>(null);
  const [pageToken, setPageToken] = useState("");
  const [showTechnical, setShowTechnical] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [verificationDraft, setVerificationDraft] = useState({ reference: "", amount: "", paymentDate: "", paymentClock: "", evidence: "" });
  const expectedAmount = selected ? Number(selected.amount.units || "0") + Number(selected.amount.nanos || 0) / 1_000_000_000 : 0;
  const amountMismatch = Boolean(verificationDraft.amount) && Number(verificationDraft.amount) !== expectedAmount;

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    loadDarajaRecoveryAction().then((value) => {
      if (mounted) {
        setResult(value);
        setNow(Date.now());
      }
    });
    return () => {
      mounted = false;
    };
  }, [active]);

  // Polling keeps scheduled checks and posting retries visible without staff repeatedly refreshing the case list.
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || selected || pending) return;
      const value = await loadDarajaRecoveryAction(pageToken);
      setResult(value);
      setNow(Date.now());
    }, 15000);
    return () => window.clearInterval(timer);
  }, [active, pageToken, selected, pending]);

  // refresh replaces the current page; keeping it avoids accidentally duplicating cursor results.
  const refresh = (token = "") =>
    start(async () => {
      setPageToken(token);
      setResult(await loadDarajaRecoveryAction(token));
      setNow(Date.now());
    });

  // recover preserves the original request identity so every action remains a recovery, never a new charge.
  const recover = (data: FormData) =>
    start(async () => {
      const outcome = await recoverDarajaAction(data);
      setFeedback(outcome);
      if (outcome.ok) {
        setSelected(null);
        setResult(await loadDarajaRecoveryAction(pageToken));
        setNow(Date.now());
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>M-Pesa recovery</CardTitle>
        <CardDescription>
          Payments update automatically while this page is open. Checking a request never sends another prompt.
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
            {result.payments.length ? (
              <p className="text-sm text-muted-foreground">
                {result.payments.length} unresolved {result.payments.length === 1 ? "payment" : "payments"} in this branch. Cases needing a decision appear first.
              </p>
            ) : null}
            {!result.payments.length ? (
              <p className="text-muted-foreground">
                No unresolved M-Pesa payments in this branch.
              </p>
            ) : null}
            <div className="grid gap-4 xl:grid-cols-2">
            {[...result.payments].sort((a, b) => {
              const priority = (payment: DarajaPayment) => payment.receiptStatus === "failed" || payment.receiptStatus === "manual_review" || payment.recoveryStatus === "received_needs_receipt" || payment.recoveryStatus === "received_needs_review" || payment.recoveryStatus === "needs_review" || (!payment.checkoutRequestId && payment.recoveryStatus !== "not_sent") ? 0 : 1;
              return priority(a) - priority(b);
            }).map((payment) => {
              const postingNeedsReview = payment.receiptStatus === "failed" || payment.receiptStatus === "manual_review";
              let outcome = "Waiting for confirmation";
              let badgeVariant: "pending" | "verified" | "destructive" = "pending";
              if (postingNeedsReview) {
                outcome = "Payment received · posting needs review";
                badgeVariant = "destructive";
              } else if (payment.receiptStatus) {
                outcome = "Payment received · posting in progress";
                badgeVariant = "verified";
              } else if (payment.recoveryStatus === "received_needs_receipt") {
                outcome = "Payment confirmed · verify receipt";
                badgeVariant = "verified";
              } else if (payment.recoveryStatus === "received_needs_review") {
                outcome = "Payment received · review needed";
                badgeVariant = "verified";
              } else if (payment.status === "failed") {
                outcome = "Payment failed";
                badgeVariant = "destructive";
              } else if (payment.recoveryStatus === "not_sent") {
                outcome = "Prompt not sent";
              } else if (payment.recoveryStatus === "needs_review") {
                outcome = "Outcome unknown · review needed";
                badgeVariant = "destructive";
              }
              const createdAt = new Date(payment.createdAt);
              const ageMinutes = now === null ? 0 : Math.max(0, Math.floor((now - createdAt.getTime()) / 60000));
              const relativeAge = ageMinutes < 1
                ? "just now"
                : new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                    -Math.floor(ageMinutes < 60 ? ageMinutes : ageMinutes < 1440 ? ageMinutes / 60 : ageMinutes < 43200 ? ageMinutes / 1440 : ageMinutes / 43200),
                    ageMinutes < 60 ? "minute" : ageMinutes < 1440 ? "hour" : ageMinutes < 43200 ? "day" : "month",
                  );
              return (
              <Card key={payment.paymentRequestId} size="sm">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{formatMoney(payment.amount)}</CardTitle>
                    <CardDescription>
                      {payment.phoneNumber || "Phone not recorded"} · {createdAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} EAT
                    </CardDescription>
                  </div>
                  <Badge variant={badgeVariant}>{outcome}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <p className="text-muted-foreground">Started {relativeAge}</p>
                  {payment.recoveryStatus === "received_needs_receipt" ? <p>Next: verify the receipt against the business statement.</p> : null}
                  {postingNeedsReview ? <p>Next: resolve the posting issue, then retry the saved receipt.</p> : null}
                  {payment.recoveryStatus === "needs_review" ? <p>Next: check the business statement before confirming whether money arrived.</p> : null}
                  {payment.recoveryStatus === "not_sent" ? <p>No prompt was sent. Resume the original payment request from the contribution flow.</p> : null}
                  {payment.mpesaReference ? <p>M-Pesa receipt: {payment.mpesaReference}</p> : null}
                  {payment.lastError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Posting needs review</AlertTitle>
                      <AlertDescription>{payment.lastError}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {payment.checkoutRequestId && payment.status === "pending" && !payment.recoveryStatus.startsWith("received") ? <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      const data = new FormData();
                      data.set("paymentRequestId", payment.paymentRequestId);
                      data.set("action", "query");
                      recover(data);
                    }}
                  >
                    Check with M-Pesa
                  </Button> : null}
                  {result.context.canApprove && !payment.checkoutRequestId && payment.status === "pending" && payment.recoveryStatus !== "not_sent" ? (
                    <Button variant="outline" disabled={pending} onClick={() => {
                      setFeedback(null);
                      setShowTechnical(false);
                      setVerificationDraft({
                        reference: "",
                        amount: `${payment.amount.units || "0"}.${String(payment.amount.nanos || 0).padStart(9, "0").slice(0, 2)}`,
                        paymentDate: "",
                        paymentClock: "",
                        evidence: "",
                      });
                      setSelected(payment);
                    }}>
                      Restore checkout ID
                    </Button>
                  ) : null}
                  {result.context.canApprove && payment.recoveryStatus !== "not_sent" && (!payment.receiptStatus || postingNeedsReview) ? (
                    <Button
                      disabled={pending}
                      onClick={() => {
                        setFeedback(null);
                        setShowTechnical(false);
                        setVerificationDraft({ reference: "", amount: `${payment.amount.units || "0"}.${String(payment.amount.nanos || 0).padStart(9, "0").slice(0, 2)}`, paymentDate: "", paymentClock: "", evidence: "" });
                        setSelected(payment);
                      }}
                    >
                      {postingNeedsReview ? "Review posting" : "Verify received payment"}
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
              );
            })}
            </div>
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
          if (!pending && !open) {
            setSelected(null);
            setShowTechnical(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selected?.receiptStatus
                ? "Retry contribution posting"
                : !selected?.checkoutRequestId && selected?.recoveryStatus !== "not_sent"
                  ? "Resolve missing checkout ID"
                : "Verify received payment"}
            </DialogTitle>
            <DialogDescription>
              {selected?.receiptStatus
                ? "Retry the saved allocation after resolving the reported issue."
                : !selected?.checkoutRequestId && selected?.recoveryStatus !== "not_sent"
                  ? "Use the exact checkout ID from the provider response or backend log. Restoring it schedules a status check without sending a prompt. If the payment is already verified, you can reconcile it below."
                : "Compare the payment with the SACCO M-Pesa business statement before confirming it."}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <form
              onChange={(event) => {
                const data = new FormData(event.currentTarget);
                setVerificationDraft({
                  reference: String(data.get("mpesaReference") ?? ""),
                  amount: String(data.get("amount") ?? ""),
                  paymentDate: String(data.get("paymentDate") ?? ""),
                  paymentClock: String(data.get("paymentClock") ?? ""),
                  evidence: String(data.get("evidence") ?? ""),
                });
              }}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const date = String(data.get("paymentDate") ?? "");
                const time = String(data.get("paymentClock") ?? "");
                if (date && time) data.set("receivedAt", `${date}T${time}:00+03:00`);
                data.delete("paymentDate");
                data.delete("paymentClock");
                recover(data);
              }}
            >
              <input
                type="hidden"
                name="paymentRequestId"
                value={selected.paymentRequestId}
              />
              <input
                type="hidden"
                name="action"
                value={selected.receiptStatus ? "retry_posting" : !selected.checkoutRequestId && selected.recoveryStatus !== "not_sent" ? "restore_checkout" : "reconcile"}
              />
              <FieldGroup>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="font-semibold uppercase tracking-wide">Payment being checked</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{formatMoney(selected.amount)}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                    <p><span className="text-muted-foreground">Phone</span><br /><span className="font-medium">{selected.phoneNumber || "Not recorded"}</span></p>
                    <p><span className="text-muted-foreground">Requested</span><br /><span className="font-medium">{new Date(selected.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} EAT</span></p>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">{selected.receiptStatus ? "Retry the saved receipt after resolving the posting issue." : "Match this request with the business statement before saving."}</CardFooter>
                </Card>
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setShowTechnical(!showTechnical)}>
                  {showTechnical ? "Hide" : "Show"} technical details
                </Button>
                {showTechnical ? <p className="break-all text-xs text-muted-foreground">Member {selected.memberId}<br />Request {selected.paymentRequestId}<br />Checkout {selected.checkoutRequestId || "missing"}</p> : null}
                {selected.mpesaReference ? <p className="text-sm font-medium">M-Pesa receipt {selected.mpesaReference}</p> : null}
                {selected.lastError ? <Alert variant="destructive"><AlertTitle>Posting issue</AlertTitle><AlertDescription>{selected.lastError}</AlertDescription></Alert> : null}
                {!selected.receiptStatus && !selected.checkoutRequestId && selected.recoveryStatus !== "not_sent" ? (
                  <Field>
                    <FieldLabel htmlFor="recovery-checkout">Verified checkout request ID</FieldLabel>
                    <Input id="recovery-checkout" name="checkoutRequestId" required />
                    <FieldDescription>Copy the exact ID from the provider response or backend log.</FieldDescription>
                  </Field>
                ) : !selected.receiptStatus ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold uppercase tracking-wide">Business statement details</p>
                      <p className="text-sm text-muted-foreground">Use the SACCO statement. An SMS or screenshot alone is insufficient.</p>
                    </div>
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
                        key={selected.paymentRequestId}
                        id="recovery-amount"
                        name="amount"
                        defaultValue={`${selected.amount.units || "0"}.${String(selected.amount.nanos || 0).padStart(9, "0").slice(0, 2)}`}
                        inputMode="decimal"
                        required
                      />
                      <FieldDescription>
                        Expected {formatMoney(selected.amount)}. Confirm the amount in the business statement.
                      </FieldDescription>
                      {amountMismatch ? (
                        <p className="text-sm font-medium text-destructive">Amount differs from the original request. Check the statement before proceeding.</p>
                      ) : null}
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Payment date</FieldLabel>
                        <input type="hidden" name="paymentDate" value={verificationDraft.paymentDate} />
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-start font-normal" />}>
                            <CalendarDaysIcon data-icon="inline-start" />
                            {verificationDraft.paymentDate ? format(new Date(`${verificationDraft.paymentDate}T12:00:00`), "d MMM yyyy") : "Choose date"}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={verificationDraft.paymentDate ? new Date(`${verificationDraft.paymentDate}T12:00:00`) : undefined}
                              onSelect={(date) => {
                                if (!date) return;
                                setVerificationDraft((current) => ({ ...current, paymentDate: format(date, "yyyy-MM-dd") }));
                                setCalendarOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="recovery-time">Payment time (Nairobi)</FieldLabel>
                        <Input id="recovery-time" name="paymentClock" type="time" required />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="recovery-evidence">Business statement reference</FieldLabel>
                      <Input
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
                  <FieldDescription>Describe what you verified or fixed. This is saved in the recovery audit trail.</FieldDescription>
                </Field>
                {!selected.receiptStatus && selected.checkoutRequestId ? (
                  <Alert>
                    <AlertTitle>Review before confirming</AlertTitle>
                    <AlertDescription className="flex flex-col gap-1 break-words">
                      <span>Expected {formatMoney(selected.amount)} · Statement amount {verificationDraft.amount ? `KES ${verificationDraft.amount}` : "not entered"}</span>
                      <span>Receipt {verificationDraft.reference || "not entered"} · Paid {verificationDraft.paymentDate && verificationDraft.paymentClock ? new Date(`${verificationDraft.paymentDate}T${verificationDraft.paymentClock}:00+03:00`).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " EAT" : "not entered"}</span>
                      <span>Statement reference {verificationDraft.evidence || "not entered"}</span>
                      <span className="font-medium">This saves verified evidence for the original request. It does not send another prompt.</span>
                    </AlertDescription>
                  </Alert>
                ) : null}
                <Button
                  disabled={pending || (!selected.receiptStatus && Boolean(selected.checkoutRequestId) && (amountMismatch || !verificationDraft.paymentDate || !verificationDraft.paymentClock))}
                  type="submit"
                >
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {selected.receiptStatus
                    ? "Retry posting existing payment"
                    : !selected.checkoutRequestId && selected.recoveryStatus !== "not_sent"
                      ? "Restore checkout and check status"
                    : "Confirm verified payment"}
                </Button>
              </FieldGroup>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
