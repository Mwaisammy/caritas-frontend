"use client";

import {useActionState, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {LoaderCircle, ArrowUpFromLine} from "lucide-react";
import CurrencyInput, {formatValue} from "react-currency-input-field";

import type {ShareActionState} from "@/app/dashboard/shares/actions";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

// WithdrawSharesDialog records a withdrawal while preserving uncertain requests for retry.
export function WithdrawSharesDialog({accountId, submitAction}: {
  accountId: string;
  submitAction: (previous: ShareActionState, formData: FormData) => Promise<ShareActionState>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  // Keep the exact payload after an uncertain response so retrying cannot post twice.
  const submission = useRef<FormData | null>(null);
  const [state, action, pending] = useActionState(async (previous: ShareActionState, data: FormData): Promise<ShareActionState> => {
    submission.current ??= data;
    try {
      const result = await submitAction(previous, submission.current);
      if (result && !result.ok && previous?.ok === false && previous.retry) return {...result, retry: true};
      if (result?.ok || (result && !result.retry)) submission.current = null;
      return result;
    } catch {
      return {ok: false, retry: true, message: "The response was lost. Retry to confirm this withdrawal."};
    }
  }, null);
  const retry = state?.ok === false && state.retry === true;
  const errors = showFeedback && !pending && state && !state.ok ? state.fieldErrors : undefined;
  const disabled = pending || state?.ok === true;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (pending) return;
      setOpen(nextOpen);
      setShowFeedback(retry);
      // Refresh the balance and give the next withdrawal a fresh server-bound reference.
      if (!nextOpen && state?.ok) router.refresh();
    }}>
      <DialogTrigger render={<Button variant="outline" disabled={state?.ok === true} />}>
        <ArrowUpFromLine data-icon="inline-start" />Withdraw
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Withdraw shares</DialogTitle>
          <DialogDescription>
            Enter the amount to withdraw and a reason. This will reduce the available share balance.
          </DialogDescription>
        </DialogHeader>
        <form action={action} onSubmit={() => setShowFeedback(true)} className="flex flex-col gap-6">
          <input name="accountId" type="hidden" value={accountId} />
          <input name="amount" type="hidden" value={amount} />
          <FieldGroup>
            <Field data-invalid={Boolean(errors?.amount)} data-disabled={disabled}>
              <FieldLabel htmlFor="withdrawal-amount">Amount (KES)</FieldLabel>
              <CurrencyInput
                id="withdrawal-amount"
                customInput={Input}
                value={amount}
                onValueChange={(value) => setAmount(value ?? "")}
                decimalsLimit={2}
                allowNegativeValue={false}
                disableAbbreviations
                decimalSeparator="."
                groupSeparator=","
                inputMode="decimal"
                prefix="KES "
                placeholder="KES 0.00"
                disabled={disabled}
                readOnly={retry}
                required
                aria-invalid={Boolean(errors?.amount)}
                aria-describedby={errors?.amount ? "withdrawal-amount-error" : undefined}
              />
              {errors?.amount && <FieldError id="withdrawal-amount-error">{errors.amount[0]}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(errors?.reason)} data-disabled={disabled}>
              <FieldLabel htmlFor="withdrawal-reason">Reason</FieldLabel>
              <Textarea
                id="withdrawal-reason"
                name="reason"
                placeholder="Explain why these shares are being withdrawn."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={5}
                maxLength={500}
                disabled={disabled}
                readOnly={retry}
                required
                aria-invalid={Boolean(errors?.reason)}
                aria-describedby={errors?.reason ? "withdrawal-reason-error" : undefined}
              />
              {errors?.reason && <FieldError id="withdrawal-reason-error">{errors.reason[0]}</FieldError>}
            </Field>
          </FieldGroup>
          {showFeedback && !pending && state && (
            <Alert variant={state.ok ? "default" : "destructive"} role={state.ok ? "status" : "alert"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {retry && <p className="text-sm text-muted-foreground">Outcome not confirmed. Retry these same details before starting another withdrawal.</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              {state?.ok ? "Done" : "Cancel"}
            </DialogClose>
            <Button disabled={disabled} type="submit">
              {pending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              {retry ? "Retry withdrawal" : amount ? `Withdraw ${formatValue({value: amount, prefix: "KES ", decimalScale: 2, groupSeparator: ",", decimalSeparator: "."})}` : "Withdraw shares"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}