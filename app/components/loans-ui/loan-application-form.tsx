"use client";

import { CurrencyInput } from "@/components/currency-input";
import {startTransition, useActionState, useCallback, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {ArrowLeft, LoaderCircle, Plus, Send, Trash2} from "lucide-react";
import type {Member} from "@/lib/go-api-client";

import {applyForLoanAction, getMemberShareSecurityAction} from "@/app/dashboard/loans/actions";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet} from "@/components/ui/field";
import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {GuarantorFields} from "./guarantor-fields";
import {LoanFeedback, LoanFieldError} from "./form-parts";
import {formatLoanMoney, loanMoneyUnits, shareMoneyDecimal} from "./loan-badges";

// LoanApplicationForm keeps terms and proposed security visible together for review.
export function LoanApplicationForm({member}: {member: Member}) {
  const [state, action, pending] = useActionState(applyForLoanAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const [guarantors, setGuarantors] = useState(1);
  const [terms, setTerms] = useState({principal: "", interestRate: "", repaymentPeriodMonths: "", sharePledge: ""});
  const [security, setSecurity] = useState<Awaited<ReturnType<typeof getMemberShareSecurityAction>> | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [proposals, setProposals] = useState<Record<string, {memberId: string; amount: bigint}>>({});
  const principalInput = useRef<HTMLInputElement>(null);
  const pledgeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const response = await getMemberShareSecurityAction(member.id);
        if (!cancelled) setSecurity(response);
      } catch {
        if (!cancelled) setSecurity({ok: false, message: "Couldn’t load share availability. Please retry."});
      }
    });
    return () => { cancelled = true; };
  }, [member.id, refresh]);

  // Keep each row's checked guarantee in the coverage preview, including removal and changed selections.
  const updateGuarantee = useCallback((id: string, memberId: string, amount: bigint) => {
    setProposals((current) => {
      const next = {...current};
      if (memberId) next[id] = {memberId, amount};
      else delete next[id];
      return next;
    });
  }, []);

  const balance = security?.ok ? loanMoneyUnits(shareMoneyDecimal(security.balance)) : null;
  const available = security?.ok ? loanMoneyUnits(shareMoneyDecimal(security.guarantorAvailableAmount)) : null;
  const ceiling = balance === null ? null : balance * BigInt(3);
  const principal = loanMoneyUnits(terms.principal);
  const pledge = loanMoneyUnits(terms.sharePledge);
  // Format exact ledger units without converting money calculations to floating point.
  const decimal = (value: bigint) => `${value / BigInt(10_000)}.${(value % BigInt(10_000)).toString().padStart(4, "0")}`;
  const principalError = principal !== null && ceiling !== null && principal > ceiling
    ? `Principal exceeds the 3× share limit by ${formatLoanMoney(decimal(principal - ceiling))}. Maximum: ${formatLoanMoney(decimal(ceiling))}.` : "";
  const pledgeError = pledge !== null && available !== null && pledge > available
    ? `Pledge exceeds available shares by ${formatLoanMoney(decimal(pledge - available))}.` : "";
  const seen = new Set<string>();
  let guaranteed = BigInt(0);
  for (const proposal of Object.values(proposals)) {
    if (!seen.has(proposal.memberId)) guaranteed += proposal.amount;
    seen.add(proposal.memberId);
  }
  const missing = security?.ok && principal !== null && pledge !== null && !pledgeError ? principal - pledge - guaranteed : null;

  useEffect(() => {
    principalInput.current?.setCustomValidity(principalError || (!security?.ok ? "Check share availability before submitting." : ""));
    pledgeInput.current?.setCustomValidity(pledgeError);
  }, [principalError, pledgeError, security]);

  return (
    <form action={action} className="flex flex-col gap-6" ref={formRef}>
      <nav aria-label="Application progress" className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <ol className="grid grid-cols-3">
          {["Application", "Review", "Sent"].map((label, index) => {
            const current = reviewing ? 1 : 0;
            const complete = index < current;
            const active = index === current;
            return <li aria-current={active ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center" key={label}>
              {index > 0 ? <span aria-hidden="true" className={`absolute left-[-50%] right-[calc(50%+1rem)] top-4 h-0.5 ${index <= current ? "bg-rose-800" : "bg-muted"}`} /> : null}
              <span className={`relative z-10 flex size-8 items-center justify-center rounded-full text-sm ring-4 ring-card ${complete || active ? "bg-rose-800 text-white" : "bg-muted text-muted-foreground"}`}>{complete ? "✓" : index + 1}</span>
              <span className={`text-xs ${active ? "font-semibold text-rose-800" : "text-muted-foreground"}`}>{label}</span>
            </li>;
          })}
        </ol>
      </nav>
      <div className={reviewing ? "hidden" : "flex flex-col gap-6"}>
      <Card>
        <CardHeader>
          <CardTitle>Applicant shares</CardTitle>
          <CardDescription>{member.profile?.personal?.fullName || "Unnamed member"} · Member no. {member.memberNumber}</CardDescription>
          <CardAction><Button type="button" variant="outline" size="sm" disabled={pending || !security} onClick={() => { setSecurity(null); setRefresh((value) => value + 1); }}>{security && !security.ok ? "Retry" : "Refresh"}</Button></CardAction>
        </CardHeader>
        <CardContent aria-live="polite" aria-busy={!security}>
          {!security ? <div className="flex flex-col gap-3"><p role="status">Checking shares…</p><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div></div> : security.ok ? (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-sm text-muted-foreground">Current shares</dt><dd>{formatLoanMoney(shareMoneyDecimal(security.balance))}</dd></div>
              <div><dt><Link href={`/dashboard/shares/${security.accountId}`} target="_blank" rel="noreferrer" className="text-sm underline">Already pledged (share details)</Link></dt><dd>{formatLoanMoney(shareMoneyDecimal(security.activePledgedAmount))}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Available to pledge</dt><dd className="text-xl font-semibold">{formatLoanMoney(shareMoneyDecimal(security.guarantorAvailableAmount))}</dd></div>
            </dl>
          ) : <Alert variant="destructive"><AlertTitle>Couldn’t load share availability</AlertTitle><AlertDescription>{security.message}</AlertDescription></Alert>}
        </CardContent>
        <CardFooter>
          <Alert>
            <AlertTitle>3× SHARE RULE — principal cannot exceed three times current shares</AlertTitle>
            <AlertDescription>
              <p>Principal ceiling: <strong>{ceiling === null ? "Awaiting share check" : formatLoanMoney(decimal(ceiling))}</strong>. Guarantors do not increase this ceiling.</p>
              <p>Security must also cover the principal. The server enforces the 3× limit at application, approval and disbursement using current shares.</p>
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <FieldSet>
          <FieldLegend>Member and loan terms</FieldLegend>
          <FieldDescription>{member.profile?.personal?.fullName || "Unnamed member"} · Member no. {member.memberNumber} · <Link href="/dashboard/members" className="underline">Change member</Link></FieldDescription>
          <input name="memberId" type="hidden" value={member.id} />
          <FieldGroup className="grid sm:grid-cols-2">
            <Field data-disabled={pending} data-invalid={Boolean(principalError || (state && !state.ok && state.fieldErrors?.principal))}>
              <FieldLabel htmlFor="principal">Principal (KES)</FieldLabel>
              <CurrencyInput ref={principalInput} id="principal" name="principal" inputMode="decimal" disabled={pending} required value={terms.principal} onValueChange={(principal) => setTerms({...terms, principal})} aria-describedby="principal-limit principal-error" aria-invalid={Boolean(principalError || (state && !state.ok && state.fieldErrors?.principal))} />
              <FieldDescription id="principal-limit">3× share limit: {ceiling === null ? "awaiting a successful share check" : formatLoanMoney(decimal(ceiling))}. Subject to security and approval.</FieldDescription>
              <FieldError id="principal-error" aria-live="polite">{principalError}</FieldError>
              <LoanFieldError name="principal" state={state} />
            </Field>
            <Field data-disabled={pending} data-invalid={Boolean(state && !state.ok && state.fieldErrors?.interestRate)}>
              <FieldLabel htmlFor="interestRate">Monthly interest rate (%)</FieldLabel>
              <Input
                id="interestRate"
                name="interestRate"
                inputMode="decimal"
                pattern="[0-9]+([.][0-9]{1,2})?"
                disabled={pending}
                required
                value={terms.interestRate}
                onChange={(event) => {
                  const interestRate = event.target.value;
                  if (/^\d*(\.\d{0,2})?$/.test(interestRate)) setTerms({...terms, interestRate});
                }}
                aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.interestRate)}
              />
              <LoanFieldError name="interestRate" state={state} />
              <FieldDescription>Enter 1 for 1% per month, or 0 for an interest-free loan. Interest is charged on the month’s opening unpaid principal.</FieldDescription>
            </Field>
            <Field data-disabled={pending} data-invalid={Boolean(state && !state.ok && state.fieldErrors?.repaymentPeriodMonths)}>
              <FieldLabel htmlFor="repaymentPeriodMonths">Repayment period (months)</FieldLabel>
              <Input id="repaymentPeriodMonths" name="repaymentPeriodMonths" type="number" min={1} max={36} disabled={pending} required value={terms.repaymentPeriodMonths} onChange={(event) => setTerms({...terms, repaymentPeriodMonths: event.target.value})} aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.repaymentPeriodMonths)} />
              <LoanFieldError name="repaymentPeriodMonths" state={state} />
            </Field>
            <Field data-disabled={pending} data-invalid={Boolean(pledgeError || (state && !state.ok && state.fieldErrors?.sharePledge))}>
              <FieldLabel htmlFor="sharePledge">Applicant share pledge (KES)</FieldLabel>
              <CurrencyInput ref={pledgeInput} id="sharePledge" name="sharePledge" inputMode="decimal" disabled={pending} required placeholder="0.00" value={terms.sharePledge} onValueChange={(sharePledge) => setTerms({...terms, sharePledge})} aria-describedby="pledge-limit pledge-error" aria-invalid={Boolean(pledgeError || (state && !state.ok && state.fieldErrors?.sharePledge))} />
              <Button type="button" variant="outline" size="sm" disabled={pending || available === null || principal === null || principal <= BigInt(0)} onClick={() => {
                if (available === null || principal === null) return;
                const amount = (available < principal ? available : principal) / BigInt(100);
                setTerms({...terms, sharePledge: `${amount / BigInt(100)}.${(amount % BigInt(100)).toString().padStart(2, "0")}`});
              }}>Use available</Button>
              <FieldDescription id="pledge-limit">Available to pledge: {available === null ? "awaiting a successful share check" : formatLoanMoney(decimal(available))}. Use 0 if guarantors provide all security.</FieldDescription>
              <FieldError id="pledge-error" aria-live="polite">{pledgeError}</FieldError>
              <LoanFieldError name="sharePledge" state={state} />
            </Field>
          </FieldGroup>
        </FieldSet>
      </section>
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
              <GuarantorFields applicantId={member.id} disabled={pending} state={state} onGuaranteeChange={updateGuarantee} />
              {guarantors > 1 && index === guarantors - 1 ? <Button variant="ghost" type="button" disabled={pending} onClick={() => setGuarantors((count) => count - 1)}><Trash2 data-icon="inline-start" />Remove last row</Button> : null}
            </FieldSet>
          ))}
        </div>
      </section>
      <Card>
        <CardHeader><CardTitle>Security coverage</CardTitle><CardDescription>Checked proposals are a preview; approval reserves the shares. Each guarantor is counted once.</CardDescription></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3">
            <dt>Requested principal</dt><dd className="text-right">{principal === null ? "—" : formatLoanMoney(decimal(principal))}</dd>
            <dt>Applicant pledge</dt><dd className="text-right">{pledge === null ? "—" : formatLoanMoney(decimal(pledge))}</dd>
            <dt>Proposed guarantees <Badge variant="secondary">Pending approval</Badge></dt><dd className="text-right">{formatLoanMoney(decimal(guaranteed))}</dd>
            <dt>Still needed</dt><dd className="text-right font-semibold">{missing === null ? "—" : formatLoanMoney(decimal(missing > BigInt(0) ? missing : BigInt(0)))}</dd>
          </dl>
        </CardContent>
        <CardFooter aria-live="polite"><p className="text-sm">{principalError || pledgeError || (missing === null || principal === null || principal <= BigInt(0) ? "Enter valid principal and pledge amounts to check coverage." : missing > BigInt(0) ? "Add another guarantor or increase a proposed guarantee." : "Proposed security covers the principal. Guarantees still require approval.")}</p></CardFooter>
      </Card>
      <LoanFeedback state={state} />
      <div className="flex justify-between gap-3">
        <Button variant="outline" render={<Link href="/dashboard/loans" />}><ArrowLeft data-icon="inline-start" />Cancel</Button>
        <Button type="button" disabled={pending || !security?.ok || Boolean(principalError || pledgeError)} onClick={() => { if (formRef.current?.reportValidity()) setReviewing(true); }}>Review application</Button>
      </div>
      </div>
      {reviewing ? <Card>
        <CardHeader><CardTitle>Check the details</CardTitle><CardDescription>Make sure everything looks right before sending.</CardDescription></CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Member</dt><dd className="font-medium">{member.profile?.personal?.fullName || "Unnamed member"}</dd></div>
            <div><dt className="text-muted-foreground">Amount</dt><dd className="font-medium">{terms.principal ? formatLoanMoney(terms.principal) : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Interest</dt><dd className="font-medium">{terms.interestRate || "—"}% per month</dd></div>
            <div><dt className="text-muted-foreground">Repayment period</dt><dd className="font-medium">{terms.repaymentPeriodMonths || "—"} months</dd></div>
            <div><dt className="text-muted-foreground">Applicant share pledge</dt><dd className="font-medium">{terms.sharePledge ? formatLoanMoney(terms.sharePledge) : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Proposed guarantors</dt><dd className="font-medium">{Object.values(proposals).filter((proposal) => proposal.memberId).length}</dd></div>
          </dl>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => setReviewing(false)}>Go back and edit</Button>
          <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}Send application</Button>
        </CardFooter>
      </Card> : null}
    </form>
  );
}
