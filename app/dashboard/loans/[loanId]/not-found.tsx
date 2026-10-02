import Link from "next/link";
import {FileQuestion} from "lucide-react";

// LoanNotFound returns administrators to the directory when a loan ID is unavailable.
export default function LoanNotFound() { return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"><div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm"><FileQuestion className="mx-auto size-10 text-stone-300" /><h1 className="mt-4 text-xl font-semibold">Loan not found</h1><p className="mt-2 text-sm text-stone-500">The loan may not exist or may no longer be available.</p><Link className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#a91521] px-4 text-sm font-semibold text-white" href="/dashboard/loans">Back to loans</Link></div></div>; }
