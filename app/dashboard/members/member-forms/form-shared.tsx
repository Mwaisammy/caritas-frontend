import Link from "next/link";
import {AlertCircle, CheckCircle2} from "lucide-react";

import type {MemberActionState} from "../actions";

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

export function Feedback({state}: {state: MemberActionState}) {
  if (!state) return null;
  const message = state.ok ? state.data.message : state.error.message;
  return (
    <div className={`flex gap-3 rounded-xl border p-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role={state.ok ? "status" : "alert"}>
      {state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
      <div>
        <p>{message}</p>
        {state.ok && state.data.memberId ? <Link className="mt-1 inline-block font-semibold underline" href={`/dashboard/members/${state.data.memberId}`}>View member profile</Link> : null}
      </div>
    </div>
  );
}
