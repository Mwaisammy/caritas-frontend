import Link from "next/link";
import {useEffect} from "react";

import type {LoanActionState} from "@/app/dashboard/loans/actions";
import {toast} from "@/components/ui/toast";

export const loanInputClass = "mt-1.5 h-11 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm outline-none placeholder:text-stone-400 focus:border-[#a91521] focus:ring-3 focus:ring-red-100 disabled:opacity-50";
export const loanTextareaClass = "mt-1.5 min-h-24 w-full resize-y rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-[#a91521] focus:ring-3 focus:ring-red-100 disabled:opacity-50";
// LoanFieldError places server validation beside the field that needs correction.
export function LoanFieldError({state, name}: {state: LoanActionState; name: string}) { return state && !state.ok && state.fieldErrors?.[name]?.[0] ? <p className="mt-1 text-xs text-red-700">{state.fieldErrors[name]?.[0]}</p> : null; }
// LoanFeedback announces action outcomes and links a successful application to its workspace.
export function LoanFeedback({state}: {state: LoanActionState}) {
  useEffect(() => {
    if (
      !state ||
      (!state.ok && Object.keys(state.fieldErrors ?? {}).length > 0)
    ) return;
    toast.add({
      title: state.ok ? "Completed" : "Action failed",
      description: state.message,
      type: state.ok ? "success" : "error",
      priority: state.ok ? "low" : "high",
    });
  }, [state]);

  if (!state?.ok || !state.loanId) return null;
  return (
    <Link className="font-medium underline" href={`/dashboard/loans/${state.loanId}`}>View loan</Link>
  );
}
