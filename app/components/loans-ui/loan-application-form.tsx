"use client";

import {useActionState, useState} from "react";
import Link from "next/link";
import {ArrowLeft, LoaderCircle, Plus, Send, Trash2} from "lucide-react";
import type {Member} from "@/lib/go-api-client";

import {applyForLoanAction} from "@/app/dashboard/loans/actions";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {GuarantorFields} from "./guarantor-fields";
import {LoanFeedback, LoanFieldError} from "./form-parts";

// LoanApplicationForm keeps terms and proposed security visible together for review.
export function LoanApplicationForm({member}: {member: Member}) {
  const [state, action, pending] = useActionState(applyForLoanAction, null);
  const [guarantors, setGuarantors] = useState(1);
  const [terms, setTerms] = useState({principal: "", interestRate: "", repaymentPeriodMonths: "", sharePledge: ""});
  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <FieldSet>
          <FieldLegend>Member and loan terms</FieldLegend>
          <FieldDescription>{member.profile?.personal?.fullName || "Unnamed member"} · Member no. {member.memberNumber} · <Link href="/dashboard/members" className="underline">Change member</Link></FieldDescription>
          <input name="memberId" type="hidden" value={member.id} />
          <FieldGroup className="grid sm:grid-cols-2">
            <Field data-disabled={pending} data-invalid={Boolean(state && !state.ok && state.fieldErrors?.principal)}>
              <FieldLabel htmlFor="principal">Principal (KES)</FieldLabel>
              <Input id="principal" name="principal" inputMode="decimal" disabled={pending} required value={terms.principal} onChange={(event) => setTerms({...terms, principal: event.target.value})} aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.principal)} />
              <FieldDescription>Cannot exceed three times the applicant&apos;s current shares.</FieldDescription>
              <LoanFieldError name="principal" state={state} />
            </Field>
            <Field data-disabled={pending} data-invalid={Boolean(state && !state.ok && state.fieldErrors?.interestRate)}>
              <FieldLabel htmlFor="interestRate">Interest rate (%)</FieldLabel>
              <Input id="interestRate" name="interestRate" inputMode="decimal" disabled={pending} required value={terms.interestRate} onChange={(event) => setTerms({...terms, interestRate: event.target.value})} aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.interestRate)} />
              <LoanFieldError name="interestRate" state={state} />
            </Field>
            <Field data-disabled={pending} data-invalid={Boolean(state && !state.ok && state.fieldErrors?.repaymentPeriodMonths)}>
              <FieldLabel htmlFor="repaymentPeriodMonths">Repayment period (months)</FieldLabel>
              <Input id="repaymentPeriodMonths" name="repaymentPeriodMonths" type="number" min={1} max={36} disabled={pending} required value={terms.repaymentPeriodMonths} onChange={(event) => setTerms({...terms, repaymentPeriodMonths: event.target.value})} aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.repaymentPeriodMonths)} />
              <LoanFieldError name="repaymentPeriodMonths" state={state} />
            </Field>
            <Field data-disabled={pending} data-invalid={Boolean(state && !state.ok && state.fieldErrors?.sharePledge)}>
              <FieldLabel htmlFor="sharePledge">Applicant share pledge (KES)</FieldLabel>
              <Input id="sharePledge" name="sharePledge" inputMode="decimal" disabled={pending} required placeholder="0.00" value={terms.sharePledge} onChange={(event) => setTerms({...terms, sharePledge: event.target.value})} aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.sharePledge)} />
              <FieldDescription>Use 0 if guarantors provide all security. The pledge cannot exceed unreserved applicant shares.</FieldDescription>
              <LoanFieldError name="sharePledge" state={state} />
            </Field>
          </FieldGroup>
        </FieldSet>
      </section>
      <Alert>
        <AlertTitle>Available guarantor shares</AlertTitle>
        <AlertDescription>
          <p>A guarantor can offer their current shares minus all active pledges. For example, KES 10,000 in shares with KES 1,000 already pledged leaves KES 9,000 available to guarantee.</p>
          <p>Applicant security plus proposed guarantees must cover the principal. Guarantees count toward loan approval only after approval reserves their shares.</p>
        </AlertDescription>
      </Alert>
      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Proposed guarantors</h2>
          <Button type="button" variant="outline" disabled={pending || guarantors >= 20} onClick={() => setGuarantors((count) => count + 1)}><Plus data-icon="inline-start" />Add</Button>
        </div>
        <p className="text-sm text-muted-foreground">Leave the row empty if applicant shares cover the loan. Select active members by name or membership number.</p>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({length: guarantors}, (_, index) => (
            <FieldSet key={index} className="rounded-xl border p-4">
              <FieldLegend variant="label">Guarantor {index + 1}</FieldLegend>
              <GuarantorFields applicantId={member.id} disabled={pending} state={state} />
              {guarantors > 1 && index === guarantors - 1 ? <Button variant="ghost" type="button" disabled={pending} onClick={() => setGuarantors((count) => count - 1)}><Trash2 data-icon="inline-start" />Remove last row</Button> : null}
            </FieldSet>
          ))}
        </div>
      </section>
      <LoanFeedback state={state} />
      <div className="flex justify-between gap-3">
        <Button variant="outline" render={<Link href="/dashboard/loans" />}><ArrowLeft data-icon="inline-start" />Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}Submit application</Button>
      </div>
    </form>
  );
}
