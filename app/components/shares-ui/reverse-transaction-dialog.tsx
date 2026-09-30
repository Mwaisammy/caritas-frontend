"use client";

import {useActionState, useRef} from "react";
import {LoaderCircle, RotateCcw, X} from "lucide-react";

import {reverseTransactionAction} from "@/app/dashboard/shares/actions";
import {ShareFeedback, ShareFieldError, shareInputClass, shareTextareaClass} from "./form-parts";

// ReverseTransactionDialog prevents a consequential correction from happening on a single click.
export function ReverseTransactionDialog({accountId, transactionId}: {accountId: string; transactionId: string}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(reverseTransactionAction, null);
  return <><button aria-label="Reverse transaction" className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => dialog.current?.showModal()} title="Reverse transaction" type="button"><RotateCcw className="size-4" /></button>
    <dialog className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/35" ref={dialog}><div className="flex items-start justify-between border-b border-stone-200 p-5"><div><h2 className="text-lg font-semibold">Reverse transaction</h2><p className="mt-1 break-all text-sm text-stone-500">Transaction {transactionId}</p></div><button aria-label="Close" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" onClick={() => dialog.current?.close()} type="button"><X className="size-4" /></button></div>
      <form action={action} className="space-y-4 p-5"><input name="accountId" type="hidden" value={accountId} /><input name="transactionId" type="hidden" value={transactionId} /><label className="block text-sm font-medium">New reference ID<input className={`${shareInputClass} mt-1.5`} disabled={pending} name="referenceId" required /></label><ShareFieldError name="referenceId" state={state} /><label className="block text-sm font-medium">Reason<textarea className={`${shareTextareaClass} mt-1.5`} disabled={pending} name="reason" required /></label><ShareFieldError name="reason" state={state} /><ShareFeedback state={state} />
        <div className="flex justify-end gap-2"><button className="h-10 rounded-lg border border-stone-200 px-4 text-sm font-semibold" onClick={() => dialog.current?.close()} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}Reverse transaction</button></div></form>
    </dialog></>;
}
