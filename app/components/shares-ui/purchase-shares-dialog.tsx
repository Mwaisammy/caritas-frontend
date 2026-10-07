"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowDownToLine, LoaderCircle, X } from "lucide-react";

import {
  purchaseSharesAction,
  type ShareActionState,
} from "@/app/dashboard/shares/actions";
import {
  ShareFeedback,
  ShareFieldError,
  shareInputClass,
  shareTextareaClass,
} from "./form-parts";

// PurchaseSharesDialog keeps purchase form state local so the account page remains server rendered.
export function PurchaseSharesDialog({ accountId }: { accountId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState({ amount: "", reason: "" });
  // Keep the original request after an uncertain response so retrying cannot post twice.
  const submission = useRef<FormData | null>(null);
  const [state, action, pending] = useActionState(
    async (
      previous: ShareActionState,
      data: FormData,
    ): Promise<ShareActionState> => {
      if (!submission.current) {
        data.set("referenceId", crypto.randomUUID());
        submission.current = data;
      }
      try {
        const result = await purchaseSharesAction(previous, submission.current);
        if (result && !result.ok && previous?.ok === false && previous.retry)
          return { ...result, retry: true };
        if (result?.ok || (result && !result.retry)) submission.current = null;
        if (result?.ok) setValues({ amount: "", reason: "" });
        return result;
      } catch {
        return {
          ok: false,
          retry: true,
          message: "The response was lost. Retry to confirm this transaction.",
        };
      }
    },
    null,
  );
  const retry = state?.ok === false && state.retry;
  return (
    <>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a91521] px-4 text-sm font-semibold text-white hover:bg-[#8d111c]"
        onClick={() => dialog.current?.showModal()}
        type="button"
      >
        <ArrowDownToLine className="size-4" />
        Purchase
      </button>
      <dialog
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/35"
        ref={dialog}
      >
        <div className="flex items-start justify-between border-b border-stone-200 p-5">
          <div>
            <h2 className="text-lg font-semibold">Purchase shares</h2>
            <p className="mt-1 text-sm text-stone-500">
              Add share capital to this account.
            </p>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
            onClick={() => dialog.current?.close()}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        <form action={action} className="space-y-4 p-5">
          <input name="accountId" type="hidden" value={accountId} />
          <label className="block text-sm font-medium">
            Amount (KES)
            <input
              className={`${shareInputClass} mt-1.5`}
              disabled={pending}
              inputMode="decimal"
              name="amount"
              value={values.amount}
              onChange={(event) =>
                setValues({ ...values, amount: event.target.value })
              }
              readOnly={!!retry}
              placeholder="0.00"
              required
            />
          </label>
          <ShareFieldError name="amount" state={state} />
          <label className="block text-sm font-medium">
            Reason
            <textarea
              className={`${shareTextareaClass} mt-1.5`}
              disabled={pending}
              name="reason"
              value={values.reason}
              onChange={(event) =>
                setValues({ ...values, reason: event.target.value })
              }
              readOnly={!!retry}
              required
            />
          </label>
          <ShareFieldError name="reason" state={state} />
          <ShareFeedback state={state} />
          {retry ? (
            <p className="text-sm text-stone-600">
              Outcome not confirmed. Retry these same details before starting
              another transaction.
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              className="h-10 rounded-lg border border-stone-200 px-4 text-sm font-semibold"
              onClick={() => dialog.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#a91521] px-4 text-sm font-semibold text-white disabled:opacity-50"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {retry ? "Retry purchase" : "Record purchase"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
