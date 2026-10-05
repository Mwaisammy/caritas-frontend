"use client";

import {useActionState, useRef} from "react";
import {Check, LoaderCircle, Send, X, XCircle} from "lucide-react";

import {approveLoanAction, disburseLoanAction, rejectLoanAction} from "@/app/dashboard/loans/actions";
import type {LoanStatus} from "@/lib/go-api-client";
import {LoanFeedback, LoanFieldError, loanTextareaClass} from "./form-parts";

// LoanDecisionButton gives each consequential lifecycle transition the same explicit confirmation flow.
function LoanDecisionButton({loanId, kind}: {loanId: string; kind: "approve" | "reject" | "disburse"}) {
  const dialog = useRef<HTMLDialogElement>(null), action = kind === "approve" ? approveLoanAction : kind === "reject" ? rejectLoanAction : disburseLoanAction;
  const [state, submit, pending] = useActionState(action, null), labels = {approve: "Approve loan", reject: "Reject loan", disburse: "Disburse funds"}, Icon = kind === "approve" ? Check : kind === "reject" ? XCircle : Send;
  return <><button className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${kind === "approve" ? "bg-white text-[#a91521]" : kind === "reject" ? "border border-white/40 text-white" : "bg-white text-[#a91521]"}`} onClick={() => dialog.current?.showModal()} type="button"><Icon className="size-4" />{labels[kind]}</button><dialog className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/35" ref={dialog}><div className="flex items-start justify-between border-b border-stone-200 p-5"><div><h2 className="text-lg font-semibold">{labels[kind]}</h2><p className="mt-1 text-sm text-stone-500">Provide an audit reason before continuing.</p></div><button aria-label="Close" className="rounded-lg p-2" onClick={() => dialog.current?.close()} type="button"><X className="size-4" /></button></div><form action={submit} className="space-y-4 p-5"><input name="loanId" type="hidden" value={loanId} /><label className="text-sm font-medium">Reason<textarea className={loanTextareaClass} disabled={pending} name="reason" required /></label><LoanFieldError name="reason" state={state} /><LoanFeedback state={state} /><div className="flex justify-end gap-2"><button className="h-10 rounded-lg border px-4 text-sm font-semibold" onClick={() => dialog.current?.close()} type="button">Cancel</button><button className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white ${kind === "reject" ? "bg-red-700" : "bg-[#a91521]"}`} disabled={pending} type="submit">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Icon className="size-4" />}{labels[kind]}</button></div></form></dialog></>;
}

// LoanLifecycleActions exposes only transitions supported by the current loan state.
export function LoanLifecycleActions({loanId, status}: {loanId: string; status: LoanStatus}) { if (status === "LOAN_STATUS_PENDING" || status === "LOAN_STATUS_MANUAL_REVIEW") return <><LoanDecisionButton kind="approve" loanId={loanId} /><LoanDecisionButton kind="reject" loanId={loanId} /></>; if (status === "LOAN_STATUS_APPROVED") return <LoanDecisionButton kind="disburse" loanId={loanId} />; return null; }
