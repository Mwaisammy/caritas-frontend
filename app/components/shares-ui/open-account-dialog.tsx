"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import type { Member } from "@/lib/go-api-client";
import { LoaderCircle, Plus, X } from "lucide-react";

import { openShareAccountAction } from "@/app/dashboard/shares/actions";
import { ShareFeedback, ShareFieldError } from "./form-parts";

// OpenAccountDialog isolates the only client state needed to launch account creation.
export function OpenAccountDialog({ member }: { member?: Member }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(openShareAccountAction, null);
  if (!member)
    return (
      <Link
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#a91521] shadow-sm hover:bg-red-50"
        href="/dashboard/members"
      >
        Select member to open account
      </Link>
    );
  return (
    <>
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#a91521] shadow-sm hover:bg-red-50"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Plus className="size-4" />
        Open share account
      </button>
      <dialog
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/35"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between border-b border-stone-200 p-5">
          <div>
            <h2 className="text-lg font-semibold">Open share account</h2>
            <p className="mt-1 text-sm text-stone-500">
              Create an account for an existing member.
            </p>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        <form action={action} className="space-y-4 p-5">
          <p className="text-sm font-medium">
            {member.profile?.personal?.fullName || "Unnamed member"} · Member
            no. {member.memberNumber}
          </p>
          <input type="hidden" name="memberId" value={member.id} />
          <ShareFieldError name="memberId" state={state} />
          <ShareFeedback state={state} />
          <div className="flex justify-end gap-2">
            <button
              className="h-10 rounded-lg border border-stone-200 px-4 text-sm font-semibold"
              onClick={() => dialogRef.current?.close()}
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
              ) : (
                <Plus className="size-4" />
              )}
              Open account
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
