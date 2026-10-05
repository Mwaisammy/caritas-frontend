"use client";

import {useEffect} from "react";
import {AlertTriangle, RefreshCw} from "lucide-react";

export default function MembersError({error, unstable_retry}: {error: Error & {digest?: string}; unstable_retry: () => void}) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7"><div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-700"><AlertTriangle /></div><h1 className="mt-5 text-2xl font-bold text-stone-950">We couldn’t open this member record</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">The member service may be temporarily unavailable. Try loading the page again.</p><button className="mx-auto mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#b71925] px-4 text-sm font-semibold text-white hover:bg-[#981521] focus:outline-none focus:ring-3 focus:ring-red-200" onClick={unstable_retry} type="button"><RefreshCw className="size-4" />Try again</button></div></div>;
}
