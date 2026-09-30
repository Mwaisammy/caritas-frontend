import Link from "next/link";
import {Landmark} from "lucide-react";

// ShareAccountNotFound returns administrators to the directory when an account does not exist.
export default function ShareAccountNotFound() {
  return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"><div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm"><Landmark className="mx-auto size-10 text-stone-300" /><h1 className="mt-4 text-xl font-semibold text-stone-950">Share account not found</h1><p className="mt-2 text-sm text-stone-500">It may have been removed, or the account ID may be incorrect.</p><Link className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#a91521] px-4 text-sm font-semibold text-white" href="/dashboard/shares">Back to share accounts</Link></div></div>;
}
