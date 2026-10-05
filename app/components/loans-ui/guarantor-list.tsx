"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Plus, ShieldCheck, Trash2, X } from "lucide-react";

import {
  addGuarantorAction,
  approveGuarantorAction,
  removeGuarantorAction,
} from "@/app/dashboard/loans/actions";
import type { LoanGuarantor } from "@/lib/go-api-client";
import { LoanFeedback, LoanFieldError, loanInputClass } from "./form-parts";
import { formatLoanMoney, LoanBadge } from "./loan-badges";

// GuarantorButton runs one row action without introducing shared client state for the whole table.
function GuarantorButton({
  loanId,
  guarantorId,
  kind,
}: {
  loanId: string;
  guarantorId: string;
  kind: "approve" | "remove";
}) {
  const [state, action, pending] = useActionState(
    kind === "approve" ? approveGuarantorAction : removeGuarantorAction,
    null,
  );
  const Icon = kind === "approve" ? ShieldCheck : Trash2;
  return (
    <form action={action}>
      <input name="loanId" type="hidden" value={loanId} />
      <input name="guarantorId" type="hidden" value={guarantorId} />
      <button
        aria-label={`${kind} guarantor`}
        className={`rounded-lg border p-2 ${kind === "remove" ? "text-red-700" : "text-emerald-700"}`}
        disabled={pending}
        title={`${kind} guarantor`}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Icon className="size-4" />
        )}
      </button>
      {state && !state.ok ? (
        <span className="sr-only">{state.message}</span>
      ) : null}
    </form>
  );
}
// AddGuarantorDialog captures the two fields required to attach another guarantee.
function AddGuarantorDialog({ loanId }: { loanId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(addGuarantorAction, null);
  return (
    <>
      <button
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-stone-900 px-3 text-sm font-semibold text-white"
        onClick={() => dialog.current?.showModal()}
        type="button"
      >
        <Plus className="size-4" />
        Add guarantor
      </button>
      <dialog
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-stone-950/35"
        ref={dialog}
      >
        <div className="flex justify-between border-b p-5">
          <h2 className="font-semibold">Add guarantor</h2>
          <button onClick={() => dialog.current?.close()} type="button">
            <X className="size-4" />
          </button>
        </div>
        <form action={action} className="space-y-4 p-5">
          <input name="loanId" type="hidden" value={loanId} />
          <label className="block text-sm font-medium">
            Guarantor member ID
            <input className={loanInputClass} name="guarantorId" required />
          </label>
          <LoanFieldError name="guarantorId" state={state} />
          <label className="block text-sm font-medium">
            Guaranteed amount
            <input
              className={loanInputClass}
              inputMode="decimal"
              name="guaranteedAmount"
              required
            />
          </label>
          <LoanFeedback state={state} />
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#a91521] px-4 text-sm font-semibold text-white"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add guarantor
          </button>
        </form>
      </dialog>
    </>
  );
}
// GuarantorList shows commitments and keeps approval or removal beside the affected guarantor.
export function GuarantorList({
  loanId,
  guarantors,
  nextHref,
}: {
  loanId: string;
  guarantors: LoanGuarantor[];
  nextHref?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">Guarantors</h2>
          <p className="mt-1 text-xs text-stone-500">
            Member commitments and approvals
          </p>
        </div>
        <AddGuarantorDialog loanId={loanId} />
      </div>
      {guarantors.length ? (
        <div className="divide-y">
          {guarantors.map((item) => (
            <div
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
              key={item.guarantorId}
            >
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-semibold">
                  {item.guarantorName || "Guarantor"}
                </h3>
                <p className="break-all text-xs text-stone-500">
                  {item.guarantorNumber || item.guarantorId}
                </p>
              </div>
              <strong>{formatLoanMoney(item.guaranteedAmount)}</strong>
              <LoanBadge status={item.status} />
              <div className="flex gap-2">
                {item.status === "GUARANTOR_STATUS_PENDING" ? (
                  <GuarantorButton
                    guarantorId={item.guarantorId}
                    kind="approve"
                    loanId={loanId}
                  />
                ) : null}
                <GuarantorButton
                  guarantorId={item.guarantorId}
                  kind="remove"
                  loanId={loanId}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-10 text-center text-sm text-stone-500">
          No guarantors are attached to this loan.
        </p>
      )}
      {nextHref ? (
        <div className="flex justify-end border-t px-5 py-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a91521]"
            href={nextHref}
          >
            More guarantors
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
