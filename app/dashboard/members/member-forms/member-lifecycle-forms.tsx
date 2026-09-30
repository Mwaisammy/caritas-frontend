"use client";

import {useActionState, useRef, useState} from "react";
import {LoaderCircle, Save, ShieldAlert} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {Member, MemberStatus} from "@/lib/go-api-client";
import {closeMemberAction, updateMemberStatusAction} from "../actions";
import {memberStatusLabel} from "../member-ui";
import {Feedback, FieldError, initialState, inputClass, resultErrors, selectClass, textareaClass} from "./form-shared";

const editableStatuses: MemberStatus[] = [
  "MEMBER_STATUS_PENDING",
  "MEMBER_STATUS_ACTIVE",
  "MEMBER_STATUS_SUSPENDED",
  "MEMBER_STATUS_REJECTED",
];

export function MemberLifecycleForms({member}: {member: Member}) {
  const closeFormRef = useRef<HTMLFormElement>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [statusState, statusAction, statusPending] = useActionState(updateMemberStatusAction, initialState);
  const [closeState, closeAction, closePending] = useActionState(closeMemberAction, initialState);
  const statusErrors = resultErrors(statusState);
  const closeErrors = resultErrors(closeState);
  const isClosed = member.status === "MEMBER_STATUS_CLOSED";

  return (
    <div className="space-y-5">
      <form action={statusAction} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <input name="memberId" type="hidden" value={member.id} />
        <h3 className="font-semibold text-stone-950">Change member status</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">Every change is recorded in the audit history.</p>
        <div className="mt-4 space-y-3">
          <div>
            <select aria-describedby={statusErrors?.newStatus ? "newStatus-error" : undefined} aria-invalid={Boolean(statusErrors?.newStatus)} className={selectClass} defaultValue={member.status} disabled={isClosed || statusPending} name="newStatus">
              {editableStatuses.map((status) => <option key={status} value={status}>{memberStatusLabel(status)}</option>)}
            </select>
            <FieldError errors={statusErrors} name="newStatus" />
          </div>
          <div>
            <textarea aria-describedby={statusErrors?.reason ? "reason-error" : undefined} aria-invalid={Boolean(statusErrors?.reason)} className={textareaClass} disabled={isClosed || statusPending} name="reason" placeholder="Reason for this status change" required />
            <FieldError errors={statusErrors} name="reason" />
          </div>
          <Feedback state={statusState} />
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={isClosed || statusPending} type="submit">
            {statusPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Update status
          </button>
        </div>
      </form>

      <form
        action={closeAction}
        className="rounded-2xl border border-red-200 bg-red-50/50 p-5"
        ref={closeFormRef}
      >
        <input name="memberId" type="hidden" value={member.id} />
        <div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 text-red-700" /><div><h3 className="font-semibold text-red-950">Close member account</h3><p className="mt-1 text-xs leading-5 text-red-700">Permanent lifecycle action. Enter a reason, then type CLOSE.</p></div></div>
        <div className="mt-4 space-y-3">
          <div>
            <textarea aria-describedby={closeErrors?.reason ? "close-reason-error" : undefined} aria-invalid={Boolean(closeErrors?.reason)} className={textareaClass} disabled={isClosed || closePending} minLength={10} name="reason" placeholder="Reason for closing this account" required />
            <FieldError errors={closeErrors} id="close-reason-error" name="reason" />
          </div>
          <div>
            <input aria-describedby={closeErrors?.confirmation ? "confirmation-error" : undefined} aria-invalid={Boolean(closeErrors?.confirmation)} className={inputClass} disabled={isClosed || closePending} name="confirmation" pattern="CLOSE" placeholder="Type CLOSE to confirm" required />
            <FieldError errors={closeErrors} name="confirmation" />
          </div>
          <Feedback state={closeState} />
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={isClosed || closePending} onClick={() => {
            if (closeFormRef.current?.reportValidity()) setCloseDialogOpen(true);
          }} type="button">
            {closePending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}{isClosed ? "Account already closed" : "Close member account"}
          </button>
        </div>
      </form>

      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this member account?</AlertDialogTitle>
            <AlertDialogDescription>
              {member.profile?.personal?.fullName ?? "This member"} will be permanently closed. This lifecycle action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={closePending}
              onClick={() => {
                setCloseDialogOpen(false);
                closeFormRef.current?.requestSubmit();
              }}
              type="button"
              variant="destructive"
            >
              Close member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
