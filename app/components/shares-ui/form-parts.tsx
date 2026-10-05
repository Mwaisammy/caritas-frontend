import Link from "next/link";
import {AlertCircle, CheckCircle2} from "lucide-react";

import type {ShareActionState} from "@/app/dashboard/shares/actions";

export const shareInputClass = "h-11 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm outline-none placeholder:text-stone-400 focus:border-[#a91521] focus:ring-3 focus:ring-red-100 disabled:opacity-50";
export const shareTextareaClass = "min-h-24 w-full resize-y rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-[#a91521] focus:ring-3 focus:ring-red-100 disabled:opacity-50";

// FieldError keeps server validation beside the input that needs correction.
export function ShareFieldError({state, name}: {state: ShareActionState; name: string}) {
  return state && !state.ok && state.fieldErrors?.[name]?.[0] ? <p className="mt-1 text-xs text-red-700">{state.fieldErrors[name]?.[0]}</p> : null;
}

// ShareFeedback announces server-action outcomes and links newly opened accounts directly.
export function ShareFeedback({state}: {state: ShareActionState}) {
  if (!state) return null;
  return <div className={`flex gap-2 rounded-lg border p-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role={state.ok ? "status" : "alert"}>{state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}<div><p>{state.message}</p>{state.ok && state.accountId ? <Link className="font-semibold underline" href={`/dashboard/shares/${state.accountId}`}>View account</Link> : null}</div></div>;
}
