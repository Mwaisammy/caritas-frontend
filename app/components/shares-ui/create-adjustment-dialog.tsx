"use client";

import {useActionState, useState} from "react";
import {useRouter} from "next/navigation";
import {LoaderCircle, Minus, Plus, SlidersHorizontal} from "lucide-react";
import CurrencyInput, {formatValue} from "react-currency-input-field";

import type {ShareActionState} from "@/app/dashboard/shares/actions";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

// CreateAdjustmentDialog gathers the amount and reason for a separately approved correction.
export function CreateAdjustmentDialog({accountId, submitAction}: {
  accountId: string;
  submitAction: (previous: ShareActionState, formData: FormData) => Promise<ShareActionState>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("add");
  const formattedAmount = formatValue({value: amount || "0", prefix: "KES ", decimalScale: 2, groupSeparator: ",", decimalSeparator: "."});
  const [reason, setReason] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [state, action, pending] = useActionState(submitAction, null);
  const errors = showFeedback && !pending && state && !state.ok ? state.fieldErrors : undefined;
  const disabled = pending || state?.ok === true;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (pending) return;
      setOpen(nextOpen);
      setShowFeedback(false);
      // Refresh after success to give the next adjustment a fresh server-bound reference.
      if (!nextOpen && state?.ok) router.refresh();
    }}>
      <DialogTrigger render={<Button variant="outline" disabled={state?.ok === true} />}>
        <SlidersHorizontal data-icon="inline-start" />Adjustment
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Create adjustment</DialogTitle>
          <DialogDescription>
            Choose whether to add to or deduct from the share balance. Changes require approval.
          </DialogDescription>
        </DialogHeader>
        <form action={action} onSubmit={() => setShowFeedback(true)} className="flex flex-col gap-6">
          <input name="accountId" type="hidden" value={accountId} />
          <input name="amount" type="hidden" value={amount && direction === "deduct" ? `-${amount}` : amount} />
          <FieldGroup>
            <Field data-disabled={disabled}>
              <FieldLabel id="adjustment-direction">Direction</FieldLabel>
              <TooltipProvider>
                <ToggleGroup
                  aria-labelledby="adjustment-direction"
                  variant="outline"
                  spacing={0}
                  className="w-full"
                  value={[direction]}
                  onValueChange={(values) => { if (values[0]) setDirection(values[0]); }}
                  disabled={disabled}
                >
                  <Tooltip>
                    <TooltipTrigger render={<ToggleGroupItem value="add" className="flex-1" />}>
                      <Plus data-icon="inline-start" />Add
                    </TooltipTrigger>
                    <TooltipContent>Add increases the share balance.</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger render={<ToggleGroupItem value="deduct" className="flex-1" />}>
                      <Minus data-icon="inline-start" />Deduct
                    </TooltipTrigger>
                    <TooltipContent>Deduct reduces the share balance.</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </TooltipProvider>
            </Field>
            <Field data-invalid={Boolean(errors?.amount)} data-disabled={disabled}>
              <FieldLabel htmlFor="adjustment-amount">Amount (KES)</FieldLabel>
              <CurrencyInput
                id="adjustment-amount"
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
                required
                aria-invalid={Boolean(errors?.amount)}
                aria-describedby={errors?.amount ? "adjustment-preview adjustment-amount-error" : "adjustment-preview"}
              />
              <FieldDescription id="adjustment-preview" aria-live="polite">
                Request to {direction} {formattedAmount}.
              </FieldDescription>
              {errors?.amount && <FieldError id="adjustment-amount-error">{errors.amount[0]}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(errors?.reason)} data-disabled={disabled}>
              <FieldLabel htmlFor="adjustment-reason">Reason</FieldLabel>
              <Textarea
                id="adjustment-reason"
                name="reason"
                placeholder="Explain why this correction is needed."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={5}
                maxLength={500}
                disabled={disabled}
                required
                aria-invalid={Boolean(errors?.reason)}
                aria-describedby={errors?.reason ? "adjustment-reason-error" : undefined}
              />
              {errors?.reason && <FieldError id="adjustment-reason-error">{errors.reason[0]}</FieldError>}
            </Field>
          </FieldGroup>
          {showFeedback && !pending && state && (
            <Alert variant={state.ok ? "default" : "destructive"} role={state.ok ? "status" : "alert"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              {state?.ok ? "Done" : "Cancel"}
            </DialogClose>
            <Button disabled={disabled} type="submit">
              {pending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              Submit for approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}