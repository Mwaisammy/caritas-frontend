"use client";

import {useEffect, useId, useRef, useState} from "react";
import {Combobox} from "@base-ui/react/combobox";
import {Check, ChevronDown, LoaderCircle} from "lucide-react";

import {getGuarantorSecurityAction, searchGuarantorMembersAction} from "@/app/dashboard/loans/actions";
import type {LoanActionState} from "@/app/dashboard/loans/actions";
import type {Member} from "@/lib/go-api-client";
import {Button} from "@/components/ui/button";
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {LoanFeedback, LoanFieldError} from "./form-parts";
import {formatLoanMoney, loanMoneyUnits, shareMoneyDecimal} from "./loan-badges";

// GuarantorFields shares member selection and capacity feedback between application
// and add-guarantor forms; duplicating it would let their limits and identifiers drift.
export function GuarantorFields({applicantId, disabled, required = false, state}: {
  applicantId: string;
  disabled: boolean;
  required?: boolean;
  state: LoanActionState;
}) {
  const id = useId();
  const amountInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchGuarantorMembersAction>> | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [security, setSecurity] = useState<Awaited<ReturnType<typeof getGuarantorSecurityAction>> | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const response = await searchGuarantorMembersAction(search);
      if (!cancelled) {
        setResult(response);
        setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    getGuarantorSecurityAction(selected.id).then((response) => {
      if (!cancelled) setSecurity(response);
    });
    return () => { cancelled = true; };
  }, [selected]);

  const available = security?.ok ? shareMoneyDecimal(security.guarantorAvailableAmount) : null;
  const offered = loanMoneyUnits(amount);
  const limit = available === null ? null : loanMoneyUnits(available);
  const overLimit = offered !== null && limit !== null && offered > limit;
  const amountError = overLimit ? `This member can guarantee at most ${formatLoanMoney(available ?? "0")} now. Reduce the amount or choose another member.` : "";

  useEffect(() => {
    amountInput.current?.setCustomValidity(
      amountError || (amount && !selected ? "Select a guarantor from the search results." : "")
      || (selected && !security?.ok ? "Wait for a successful share capacity check before submitting." : "")
      || (amount && (offered === null || offered <= BigInt(0)) ? "Enter a guaranteed amount greater than zero." : ""),
    );
  }, [amountError, amount, selected, security, offered]);

  const members = result?.ok ? result.members.filter((member) => member.id !== applicantId) : [];
  return (
    <FieldGroup>
      <input name="guarantorId" type="hidden" value={selected?.id ?? ""} />
      <Field data-disabled={disabled}>
        <FieldLabel htmlFor={`${id}-member`}>Guarantor name or membership number</FieldLabel>
        <Combobox.Root
          items={members}
          value={selected}
          filter={null}
          disabled={disabled}
          itemToStringLabel={(member) => `${member.profile?.personal?.fullName || "Unnamed member"} · ${member.memberNumber}`}
          isItemEqualToValue={(item, value) => item.id === value.id}
          onInputValueChange={(value, details) => {
            if (details.reason === "input-change") {
              setSearch(value);
              setSelected(null);
              setSecurity(null);
            }
          }}
          onValueChange={(member) => { setSelected(member); setSecurity(null); }}
        >
          <div className="flex items-center gap-2">
            <Combobox.Input id={`${id}-member`} placeholder="Search name, member no., or national ID" maxLength={100} render={<Input />} />
            <Combobox.Trigger render={<Button type="button" variant="outline" size="icon" aria-label="Show members" />}>
              {searching ? <LoaderCircle className="animate-spin" /> : <ChevronDown />}
            </Combobox.Trigger>
          </div>
          <Combobox.Portal>
            <Combobox.Positioner sideOffset={4}>
              <Combobox.Popup className="max-h-72 w-(--anchor-width) overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
                <Combobox.Empty className="p-3 text-sm text-muted-foreground">
                  {searching ? "Searching members…" : result && !result.ok ? result.message : "No active members found. Try a different name or number."}
                </Combobox.Empty>
                <Combobox.List>
                  {(member: Member) => (
                    <Combobox.Item key={member.id} value={member} className="flex cursor-default items-center justify-between gap-3 rounded-md p-2 text-sm data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                      <span>{member.profile?.personal?.fullName || "Unnamed member"}<span className="block text-xs text-muted-foreground">Member no. {member.memberNumber}</span></span>
                      <Combobox.ItemIndicator><Check className="size-4" /></Combobox.ItemIndicator>
                    </Combobox.Item>
                  )}
                </Combobox.List>
                {result?.ok && result.nextPageToken ? <p className="p-2 text-xs text-muted-foreground">Showing 20 results. Type a more specific name or membership number.</p> : null}
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <LoanFieldError name="guarantorId" state={state} />
      </Field>
      {selected && !security ? <p role="status" className="text-sm text-muted-foreground">Checking this member&apos;s share capacity…</p> : null}
      {security && !security.ok ? <LoanFeedback state={security} /> : null}
      {security?.ok ? (
        <FieldDescription role="status">
          Shares: {formatLoanMoney(shareMoneyDecimal(security.balance))}. Already pledged: {formatLoanMoney(shareMoneyDecimal(security.activePledgedAmount))}.
          <strong className="block">Can guarantee up to {formatLoanMoney(available ?? "0")} now.</strong>
          This is 30% of their current shares minus all active pledges. Capacity is checked again at approval.
        </FieldDescription>
      ) : null}
      <Field data-disabled={disabled} data-invalid={overLimit}>
        <FieldLabel htmlFor={`${id}-amount`}>Guaranteed amount (KES)</FieldLabel>
        <Input id={`${id}-amount`} ref={amountInput} name="guaranteedAmount" inputMode="decimal" value={amount} disabled={disabled} required={required || Boolean(selected)} aria-invalid={overLimit} onChange={(event) => setAmount(event.target.value)} />
        {amountError ? <FieldError>{amountError}</FieldError> : null}
        <LoanFieldError name="guaranteedAmount" state={state} />
      </Field>
    </FieldGroup>
  );
}
