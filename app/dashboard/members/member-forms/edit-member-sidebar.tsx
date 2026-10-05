"use client";

import {useRef} from "react";
import {PencilLine, X} from "lucide-react";

import type {Member} from "@/lib/go-api-client";
import {MemberProfileForm} from "./member-profile-form";

export function EditMemberSidebar({member}: {member: Member}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 focus:outline-none focus:ring-3 focus:ring-red-100"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <PencilLine className="size-4" />Edit profile
      </button>

      <dialog
        aria-labelledby="edit-member-title"
        className="fixed inset-y-0 right-0 left-auto m-0 ml-auto hidden h-dvh max-h-none w-full max-w-2xl overflow-hidden border-0 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/35 backdrop:backdrop-blur-[1px] open:flex open:flex-col"
        ref={dialogRef}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold" id="edit-member-title">Edit member profile</h2>
            <p className="mt-1 text-sm text-stone-500">Update contact, employment, identification, and next-of-kin details.</p>
          </div>
          <button
            aria-label="Close profile editor"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-3 focus:ring-red-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <MemberProfileForm key={member.lastUpdated} member={member} />
        </div>
      </dialog>
    </>
  );
}
