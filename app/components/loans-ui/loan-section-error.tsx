import {CircleAlert} from "lucide-react";

// LoanSectionError keeps one optional service failure from hiding the rest of a loan workspace.
export function LoanSectionError({section}: {section: string}) { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><div className="flex items-center gap-2 font-semibold"><CircleAlert className="size-4" />{section} unavailable</div><p className="mt-1 text-amber-800">Refresh the page or try again later.</p></div>; }
