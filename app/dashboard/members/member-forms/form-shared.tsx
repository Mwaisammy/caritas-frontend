import Link from "next/link";
import {useEffect} from "react";

import type {MemberActionState} from "../actions";
import {toast} from "@/components/ui/toast";

export type FieldErrors = Record<string, string[] | undefined>;

export const initialState: MemberActionState = null;
export const inputClass = "h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm outline-none placeholder:text-stone-400 focus:border-[#9f1d2c] focus:ring-3 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50";
export const selectClass = "h-11 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-[#9f1d2c] focus:ring-3 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50";
export const textareaClass = "min-h-24 w-full resize-y rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-[#9f1d2c] focus:ring-3 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50";
export const primaryButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#b71925] px-5 text-sm font-semibold text-white transition hover:bg-[#981521] focus:outline-none focus:ring-3 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50";

export function resultErrors(state: MemberActionState) {
  return state && !state.ok ? state.error.fieldErrors : undefined;
}

export function Field({label, name, error, children}: {label: string; name: string; error?: string[]; children: React.ReactNode}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-stone-800" htmlFor={name}>{label}</label>
      {children}
      {error?.[0] ? <p className="text-xs text-red-700" id={`${name}-error`}>{error[0]}</p> : null}
    </div>
  );
}

export function FieldError({errors, name, id}: {errors?: FieldErrors; name: string; id?: string}) {
  return errors?.[name]?.[0] ? <p className="mt-1 text-xs text-red-700" id={id ?? `${name}-error`}>{errors[name]?.[0]}</p> : null;
}

// Feedback announces completed member actions while keeping profile navigation beside the form.
export function Feedback({state}: {state: MemberActionState}) {
  useEffect(() => {
    if (
      !state ||
      (!state.ok && Object.keys(state.error.fieldErrors ?? {}).length > 0)
    ) return;
    toast.add({
      title: state.ok ? "Completed" : "Action failed",
      description: state.ok ? state.data.message : state.error.message,
      type: state.ok ? "success" : "error",
      priority: state.ok ? "low" : "high",
    });
  }, [state]);

  if (!state?.ok || !state.data.memberId) return null;
  return <Link className="inline-block font-semibold underline" href={`/dashboard/members/${state.data.memberId}`}>View member profile</Link>;
}
