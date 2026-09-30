"use client";

import {useActionState} from "react";
import {LoaderCircle, Save, UserPlus} from "lucide-react";

import type {Member} from "@/lib/go-api-client";
import {registerMemberAction, updateMemberProfileAction} from "../actions";
import {Feedback, initialState, primaryButtonClass, resultErrors} from "./form-shared";
import {ProfileFields} from "./profile-fields";

export function MemberProfileForm({member}: {member?: Member}) {
  const action = member ? updateMemberProfileAction : registerMemberAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {member ? <input name="memberId" type="hidden" value={member.id} /> : null}
      <ProfileFields member={member} errors={resultErrors(state)} />
      <Feedback state={state} />
      <div className="flex justify-end border-t border-stone-200 pt-5">
        <button className={primaryButtonClass} disabled={pending} type="submit">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : member ? <Save className="size-4" /> : <UserPlus className="size-4" />}
          {pending ? "Saving…" : member ? "Save profile" : "Register member"}
        </button>
      </div>
    </form>
  );
}
