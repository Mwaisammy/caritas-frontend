"use client";

import {useEffect} from "react";
import {CircleAlert, RefreshCw} from "lucide-react";

// SharesError provides a local recovery path when a share route fails unexpectedly.
export default function SharesError({error, unstable_retry}: {error: Error & {digest?: string}; unstable_retry: () => void}) {
  useEffect(() => { console.error("Share route failed", error); }, [error]);
  return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"><div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-10 text-center"><CircleAlert className="mx-auto size-10 text-red-600" /><h2 className="mt-4 text-lg font-semibold text-red-950">The share workspace could not be loaded</h2><p className="mt-2 text-sm text-red-700">The service may be temporarily unavailable. Try the request again.</p><button className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white" onClick={() => unstable_retry()} type="button"><RefreshCw className="size-4" />Try again</button></div></div>;
}
