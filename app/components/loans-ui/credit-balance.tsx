"use client";

import {useActionState, useState} from "react";
import type {CreditBalance as Credit} from "@/lib/go-api-client";
import type {CreditOperation} from "@/lib/server/credits-api";
import {getCreditOperationsAction, requestCreditWithdrawalAction} from "@/app/dashboard/loans/credit-actions";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Field, FieldDescription, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {LoanFeedback, LoanFieldError} from "./form-parts";
import {formatLoanDate, formatLoanMoney, loanLabel, loanMoneyUnits, LoanBadge} from "./loan-badges";

// CreditWithdrawalDialog retains the request identity on retries and requires evidence of the member's instruction.
function CreditWithdrawalDialog({credit, loanId}: {credit: Credit; loanId: string}) {
  const [state, action, pending] = useActionState(requestCreditWithdrawalAction, null);
  const [requestId, setRequestId] = useState("");
  const [amount, setAmount] = useState("");
  const offered = loanMoneyUnits(amount);
  const available = credit.availableAmount === undefined ? null : loanMoneyUnits(credit.availableAmount);
  const invalid = offered !== null && available !== null && offered > available;
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" onClick={() => { if (!requestId) setRequestId(crypto.randomUUID()); }} />}>Request refund</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a member refund</DialogTitle>
          <DialogDescription>Available: {formatLoanMoney(credit.availableAmount)}. A request reserves credit; a second officer must approve it before payout is recorded.</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="creditBalanceId" type="hidden" value={credit.id} />
          <input name="idempotencyKey" type="hidden" value={requestId} />
          <FieldGroup>
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor={`refund-amount-${credit.id}`}>Refund amount (KES)</FieldLabel>
              <Input id={`refund-amount-${credit.id}`} name="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={pending} required aria-invalid={invalid} />
              <FieldDescription>{invalid ? "Amount exceeds the member’s available credit." : "Only available credit can be reserved for a refund."}</FieldDescription>
              <LoanFieldError name="amount" state={state} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`refund-consent-${credit.id}`}>Member instruction reference</FieldLabel>
              <Input id={`refund-consent-${credit.id}`} name="consentReference" minLength={5} required disabled={pending} />
              <FieldDescription>Reference the member’s signed request or recorded instruction.</FieldDescription>
              <LoanFieldError name="consentReference" state={state} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`refund-reason-${credit.id}`}>Reason</FieldLabel>
              <Textarea id={`refund-reason-${credit.id}`} name="reason" minLength={5} required disabled={pending} />
              <LoanFieldError name="reason" state={state} />
            </Field>
          </FieldGroup>
          <LoanFeedback state={state} />
          <Button type="submit" disabled={pending || invalid || !requestId || state?.ok === true}>{pending ? "Submitting…" : "Reserve credit and request refund"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// CreditBalance keeps zero, unavailable and reserved balances distinct and exposes the operations behind them.
export function CreditBalance({credits, loanId}: {credits: Credit[]; loanId: string}) {
  const [history, setHistory] = useState<Record<string, {loading?: boolean; error?: string; operations?: CreditOperation[]; nextPageToken?: string}>>({});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overpayments and member credit</CardTitle>
        <CardDescription>Credit associated with this loan. Other member credit is excluded. Excess repayments remain member funds until used or refunded under instruction.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!credits.length ? <p className="text-sm text-muted-foreground">KES 0.00 credit recorded for this loan. If a payment exceeded principal, check its interest and penalty allocation below.</p> : credits.map((credit) => (
          <div key={credit.id} className="flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-semibold">{loanLabel(credit.source)} credit</p><p className="text-xs text-muted-foreground">Created {formatLoanDate(credit.createdAt, true)}</p></div>
              <LoanBadge status={credit.status} />
            </div>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[["Credit created", credit.amount], ["Available now", credit.availableAmount], ["Reserved for refund", credit.reservedAmount], ["Already used or refunded", credit.usedAmount]].map(([label, amount]) => (
                <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{amount === undefined ? "Unavailable" : formatLoanMoney(amount)}</dd></div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              {credit.status === "CREDIT_STATUS_AVAILABLE" && (loanMoneyUnits(credit.availableAmount ?? "") ?? BigInt(0)) > BigInt(0) ? <CreditWithdrawalDialog credit={credit} loanId={loanId} /> : null}
              <Button type="button" variant="outline" disabled={history[credit.id]?.loading} onClick={async () => {
                setHistory((current) => ({...current, [credit.id]: {...current[credit.id], loading: true, error: undefined}}));
                try {
                  const result = await getCreditOperationsAction(credit.id, history[credit.id]?.nextPageToken);
                  setHistory((current) => ({...current, [credit.id]: result.ok
                    ? {operations: history[credit.id]?.nextPageToken ? [...(current[credit.id]?.operations ?? []), ...(result.operations ?? [])] : result.operations ?? [], nextPageToken: result.nextPageToken}
                    : {...current[credit.id], loading: false, error: result.message}}));
                } catch {
                  setHistory((current) => ({...current, [credit.id]: {...current[credit.id], loading: false, error: "Credit activity could not be loaded. Please retry."}}));
                }
              }}>{history[credit.id]?.loading ? "Loading activity…" : history[credit.id]?.nextPageToken ? "More activity" : history[credit.id]?.operations ? "Refresh activity" : "View credit activity"}</Button>
            </div>
            {history[credit.id]?.error ? <Alert variant="destructive"><AlertTitle>Activity unavailable</AlertTitle><AlertDescription>{history[credit.id].error}</AlertDescription></Alert> : null}
            {history[credit.id]?.operations?.length === 0 ? <p className="text-sm text-muted-foreground">No credit operations recorded.</p> : null}
            {history[credit.id]?.operations?.map((operation) => (
              <div key={operation.id} className="flex flex-col gap-1 border-l-2 pl-3 text-sm">
                <p className="font-medium">{operation.action.replaceAll("_", " ")} · {formatLoanMoney(operation.amount)} · {operation.status}</p>
                <p className="text-muted-foreground">{formatLoanDate(operation.createdAt, true)} · {operation.reason}</p>
                <p className="break-all text-xs">Member instruction: {operation.consentReference || "Not recorded"}. Payout: {operation.payoutReference || "Not recorded"}.</p>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
      <CardFooter><p className="text-xs text-muted-foreground">Reserved funds are not available to spend again. Frozen credit is unavailable. A refund request does not mean money has been paid out.</p></CardFooter>
    </Card>
  );
}
