"use client"

import { useActionState, useRef, useState } from "react"
import { Banknote, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { CashAllocationType, Loan, ShareMoney } from "@/lib/go-api-client"
import { closeCashierSessionAction, findCashMemberAction, openCashierSessionAction, recordCashContributionAction, type CashMemberState, type CashMutationState } from "./actions"

// AllocationAmounts is the editable draft kept in the browser until one receipt is confirmed.
type AllocationAmounts = {com: string; lgom: string; shares: string; otherCharge: string; loans: Record<string, string>}

// emptyAmounts resets optional values while preparing the required monthly fee defaults.
function emptyAmounts(loans: Loan[] = []): AllocationAmounts {
  return {com: "30.00", lgom: "30.00", shares: "", otherCharge: "", loans: Object.fromEntries(loans.map((loan) => [loan.id, ""]))}
}

// minorUnits totals draft values as cents and treats incomplete input as zero.
function minorUnits(value: string) {
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value)) return 0
  const [units, fraction = ""] = value.split(".")
  return Number(units) * 100 + Number(fraction.padEnd(2, "0"))
}

// currentPeriod selects the cashier's local contribution month rather than UTC month.
function currentPeriod() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
}

// draftAllocations omits blank rows and attaches authoritative targets loaded for the member.
function draftAllocations(amounts: AllocationAmounts, shareAccountId?: string) {
  const rows: Array<{type: CashAllocationType; targetId?: string; amount: string}> = [
    {type: "CONTRIBUTION_ALLOCATION_TYPE_COM", amount: amounts.com},
    {type: "CONTRIBUTION_ALLOCATION_TYPE_LGOM", amount: amounts.lgom},
    {type: "CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE", amount: amounts.otherCharge},
    ...(shareAccountId ? [{type: "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE" as const, targetId: shareAccountId, amount: amounts.shares}] : []),
    ...Object.entries(amounts.loans).map(([targetId, amount]) => ({type: "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL" as const, targetId, amount})),
  ]
  return rows.filter((row) => minorUnits(row.amount) > 0)
}

// formatMoney renders protobuf Money for receipt and reconciliation summaries only.
function formatMoney(money?: ShareMoney) {
  if (!money) return "--"
  const negative = money.units.startsWith("-") || money.nanos < 0
  const units = money.units.replace("-", "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const cents = String(Math.abs(money.nanos)).padStart(9, "0").slice(0, 2)
  return `${money.currencyCode || "KES"} ${negative ? "-" : ""}${units}.${cents}`
}

// formatMinorUnits renders safe integer cents without decimal floating-point arithmetic.
function formatMinorUnits(value: number) {
  const units = String(Math.floor(value / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `KES ${units}.${String(value % 100).padStart(2, "0")}`
}

// CashFeedback gives server-action outcomes an accessible text location without toast state.
function CashFeedback({state}: {state: CashMemberState | CashMutationState}) {
  if (!state) return null
  const message = "message" in state ? state.message : `Member ${state.member.memberNumber} is ready.`
  return <p className={state.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"} role={state.ok ? "status" : "alert"}>{message}</p>
}

// MoneyField keeps amount labels, constraints, and disabled behavior identical across allocations.
function MoneyField({id, label, value, onChange, readOnly}: {id: string; label: string; value: string; onChange: (value: string) => void; readOnly: boolean}) {
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel><Input id={id} inputMode="decimal" min="0" onChange={(event) => onChange(event.target.value)} placeholder="0.00" readOnly={readOnly} type="text" value={value} /></Field>
}

// MemberCard finds one active member before any financial controls are enabled.
function MemberCard({state, action, pending, locked}: {state: CashMemberState; action: (data: FormData) => void; pending: boolean; locked: boolean}) {
  return <Card><CardHeader><CardTitle>1. Find member</CardTitle><CardDescription>Use the exact national ID and confirm the member before accepting cash.</CardDescription></CardHeader>
    <CardContent><form action={action}><FieldGroup><Field data-invalid={state?.ok === false && Boolean(state.fieldErrors?.nationalId)}><FieldLabel htmlFor="nationalId">National ID</FieldLabel><Input aria-invalid={state?.ok === false && Boolean(state.fieldErrors?.nationalId)} disabled={pending || locked} id="nationalId" name="nationalId" required /><FieldError>{state?.ok === false ? state.fieldErrors?.nationalId?.[0] : undefined}</FieldError></Field><Button disabled={pending || locked} type="submit"><Search data-icon="inline-start" />{pending ? "Finding member..." : "Find member"}</Button><CashFeedback state={state} /></FieldGroup></form></CardContent>
    {state?.ok ? <CardFooter><p className="text-sm"><strong>{state.member.profile?.personal?.fullName ?? "Unnamed member"}</strong> · Member {state.member.memberNumber}</p></CardFooter> : null}</Card>
}

// TillCard makes opening or resuming cash custody an explicit cashier action.
function TillCard({state, action, pending}: {state: CashMutationState; action: () => void; pending: boolean}) {
  const session = state?.ok ? state.session : undefined
  return <Card><CardHeader><CardTitle>2. Cashier till</CardTitle><CardDescription>Every cash receipt must belong to your open till.</CardDescription></CardHeader>
    <CardContent className="flex flex-col gap-3">{session ? <><p><strong>Status:</strong> {session.status.replaceAll("_", " ")}</p><p className="font-mono text-xs text-muted-foreground">{session.id}</p></> : <p className="text-sm text-muted-foreground">No till has been opened in this workspace.</p>}<CashFeedback state={state} /></CardContent>
    {!session ? <CardFooter><form action={action}><Button disabled={pending} type="submit"><Banknote data-icon="inline-start" />{pending ? "Opening till..." : "Open or resume till"}</Button></form></CardFooter> : null}</Card>
}

// AllocationFields presents only allocation types the contribution service can currently process.
function AllocationFields({amounts, setAmounts, shareAccountId, loans, readOnly}: {amounts: AllocationAmounts; setAmounts: (value: AllocationAmounts) => void; shareAccountId?: string; loans: Loan[]; readOnly: boolean}) {
  return <FieldSet><FieldLegend>Allocation</FieldLegend><FieldDescription>COM and LGOM default to the current KES 30 monthly rates. Clear a value only when an approved exception applies.</FieldDescription><div className="grid gap-4 sm:grid-cols-2"><MoneyField id="com" label="COM (KES)" value={amounts.com} readOnly={readOnly} onChange={(com) => setAmounts({...amounts, com})} /><MoneyField id="lgom" label="LGOM (KES)" value={amounts.lgom} readOnly={readOnly} onChange={(lgom) => setAmounts({...amounts, lgom})} />
    {shareAccountId ? <MoneyField id="shares" label="Share purchase (KES)" value={amounts.shares} readOnly={readOnly} onChange={(shares) => setAmounts({...amounts, shares})} /> : null}<MoneyField id="otherCharge" label="Other approved charge (KES)" value={amounts.otherCharge} readOnly={readOnly} onChange={(otherCharge) => setAmounts({...amounts, otherCharge})} />
    {loans.map((loan) => <MoneyField id={`loan-${loan.id}`} key={loan.id} label={`Loan principal · ${loan.id.slice(0, 8)} (KES)`} value={amounts.loans[loan.id] ?? ""} readOnly={readOnly} onChange={(amount) => setAmounts({...amounts, loans: {...amounts.loans, [loan.id]: amount}})} />)}</div></FieldSet>
}

// ContributionCard submits one immutable allocation plan and preserves its key across uncertain retries.
function ContributionCard({memberState, sessionId, amounts, setAmounts, state, action, pending}: {memberState: Extract<CashMemberState, {ok: true}>; sessionId: string; amounts: AllocationAmounts; setAmounts: (value: AllocationAmounts) => void; state: CashMutationState; action: (data: FormData) => void; pending: boolean}) {
  const total = draftAllocations(amounts, memberState.shareAccount?.id).reduce((sum, row) => sum + minorUnits(row.amount), 0)
  const retry = state?.ok === false && state.retry
  return <Card><CardHeader><CardTitle>3. Record contribution</CardTitle><CardDescription>Allocate the full amount before recording the cash receipt.</CardDescription></CardHeader><CardContent><form action={action}><input name="sessionId" type="hidden" value={sessionId} /><input name="memberId" type="hidden" value={memberState.member.id} /><FieldGroup><Field><FieldLabel htmlFor="contributionPeriod">Contribution period</FieldLabel><Input defaultValue={currentPeriod()} disabled={pending} id="contributionPeriod" name="contributionPeriod" readOnly={retry} required type="month" /></Field><AllocationFields amounts={amounts} loans={memberState.loans} readOnly={Boolean(retry) || pending} setAmounts={setAmounts} shareAccountId={memberState.shareAccount?.id} /><p className="text-base"><strong>Total cash received:</strong> {formatMinorUnits(total)}</p><FieldError>{state?.ok === false ? state.fieldErrors?.allocations?.[0] : undefined}</FieldError><CashFeedback state={state} /><Button disabled={pending || total === 0} type="submit">{pending ? "Recording cash..." : retry ? "Retry same contribution" : "Record cash contribution"}</Button></FieldGroup></form></CardContent></Card>
}

// ReceiptCard shows the backend status instead of treating every returned receipt as completed.
function ReceiptCard({state}: {state: CashMutationState}) {
  if (!state?.ok || !state.receipt) return null
  return <Card><CardHeader><CardTitle>Latest receipt</CardTitle><CardDescription>{state.message}</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2"><p><strong>Reference:</strong> {state.receipt.internalReceiptReference}</p><p><strong>Status:</strong> {state.receipt.status.replaceAll("_", " ")}</p><p><strong>Amount:</strong> {formatMoney(state.receipt.amount)}</p><p><strong>Received:</strong> {state.receipt.receivedAt ? new Date(state.receipt.receivedAt).toLocaleString("en-KE") : "--"}</p></CardContent></Card>
}

// CloseTillCard sends the physical count to the backend and displays its authoritative reconciliation.
function CloseTillCard({sessionId, state, action, pending, locked}: {sessionId: string; state: CashMutationState; action: (data: FormData) => void; pending: boolean; locked: boolean}) {
  const session = state?.ok ? state.session : undefined
  return <Card><CardHeader><CardTitle>4. Close till</CardTitle><CardDescription>Count the physical cash. Add a reason whenever the backend reports a variance.</CardDescription></CardHeader><CardContent><form action={action}><input name="sessionId" type="hidden" value={sessionId} /><FieldGroup><Field data-invalid={state?.ok === false && Boolean(state.fieldErrors?.countedAmount)}><FieldLabel htmlFor="countedAmount">Counted cash (KES)</FieldLabel><Input aria-invalid={state?.ok === false && Boolean(state.fieldErrors?.countedAmount)} disabled={pending || locked || Boolean(session)} id="countedAmount" inputMode="decimal" name="countedAmount" required /><FieldError>{state?.ok === false ? state.fieldErrors?.countedAmount?.[0] : undefined}</FieldError></Field><Field><FieldLabel htmlFor="varianceReason">Variance reason</FieldLabel><Input disabled={pending || locked || Boolean(session)} id="varianceReason" maxLength={500} name="varianceReason" /></Field><CashFeedback state={state} /><Button disabled={pending || locked || Boolean(session)} type="submit" variant="destructive">{pending ? "Closing till..." : "Close till"}</Button></FieldGroup></form></CardContent>
    {session ? <CardFooter><p className="text-sm">Expected {formatMoney(session.expectedAmount)} · Counted {formatMoney(session.countedAmount)} · Variance {formatMoney(session.variance)}</p></CardFooter> : null}</Card>
}

// CashWorkspace coordinates the four cashier steps while keeping the page itself server rendered.
export function CashWorkspace() {
  const submission = useRef<FormData | null>(null)
  const [amounts, setAmounts] = useState<AllocationAmounts>(emptyAmounts())
  const [recordOwner, setRecordOwner] = useState("")
  const [memberState, findAction, finding] = useActionState(async (previous: CashMemberState, data: FormData) => { const result = await findCashMemberAction(previous, data); if (result?.ok) { setAmounts(emptyAmounts(result.loans)); setRecordOwner(""); submission.current = null } return result }, null)
  const [openState, openAction, opening] = useActionState(async () => openCashierSessionAction(), null)
  const [recordState, recordAction, recording] = useActionState(async (previous: CashMutationState, data: FormData) => { if (!submission.current && memberState?.ok) { setRecordOwner(memberState.member.id); data.set("idempotencyKey", crypto.randomUUID()); data.set("allocations", JSON.stringify(draftAllocations(amounts, memberState.shareAccount?.id))); submission.current = data } const result = await recordCashContributionAction(previous, submission.current ?? data); if (result?.ok || (result && !result.retry)) submission.current = null; if (result?.ok) setAmounts({...emptyAmounts(memberState?.ok ? memberState.loans : []), com: "", lgom: ""}); return result }, null)
  const [closeState, closeAction, closing] = useActionState(closeCashierSessionAction, null)
  const session = closeState?.ok && closeState.session ? closeState.session : openState?.ok ? openState.session : undefined
  const uncertain = recordState?.ok === false && Boolean(recordState.retry)
  return <div className="flex flex-col gap-6"><div className="grid gap-6 lg:grid-cols-2"><MemberCard action={findAction} locked={uncertain} pending={finding} state={memberState} /><TillCard action={openAction} pending={opening} state={openState} /></div>{memberState?.ok && session?.status === "open" ? <ContributionCard action={recordAction} amounts={amounts} memberState={memberState} pending={recording} sessionId={session.id} setAmounts={setAmounts} state={recordOwner === memberState.member.id ? recordState : null} /> : null}<ReceiptCard state={recordState} />{session?.status === "open" ? <CloseTillCard action={closeAction} locked={uncertain} pending={closing} sessionId={session.id} state={closeState} /> : null}</div>
}
