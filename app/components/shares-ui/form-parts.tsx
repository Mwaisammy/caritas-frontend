import Link from "next/link";
import {useEffect} from "react";

import type {ShareActionState} from "@/app/dashboard/shares/actions";
import {toast} from "@/components/ui/toast";

export const shareInputClass = "h-11 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm outline-none placeholder:text-stone-400 focus:border-[#a91521] focus:ring-3 focus:ring-red-100 disabled:opacity-50";
export const shareTextareaClass = "min-h-24 w-full resize-y rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-[#a91521] focus:ring-3 focus:ring-red-100 disabled:opacity-50";

// FieldError keeps server validation beside the input that needs correction.
export function ShareFieldError({state, name}: {state: ShareActionState; name: string}) {
  return state && !state.ok && state.fieldErrors?.[name]?.[0] ? <p className="mt-1 text-xs text-red-700">{state.fieldErrors[name]?.[0]}</p> : null;
}

// ShareFeedback announces server-action outcomes and links newly opened accounts directly.
export function ShareFeedback({state}: {state: ShareActionState}) {
  useEffect(() => {
    if (
      !state ||
      (!state.ok && Object.keys(state.fieldErrors ?? {}).length > 0)
    ) return;
    toast.add({
      title: state.ok
        ? "Completed"
        : state.retry
          ? "Outcome not confirmed"
          : "Action failed",
      description: state.message,
      type: state.ok ? "success" : state.retry ? "warning" : "error",
      priority: state.ok ? "low" : "high",
    });
  }, [state]);

  if (!state?.ok || !state.accountId) return null;
  return <Link className="font-semibold underline" href={`/dashboard/shares/${state.accountId}`}>View account</Link>;
}
