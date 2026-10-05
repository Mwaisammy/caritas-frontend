import {Building2, Search} from "lucide-react";

import type {ShareAccountStatus} from "@/lib/go-api-client";
import {OpenAccountDialog} from "./open-account-dialog";

const statuses: Array<{value: "" | ShareAccountStatus; label: string}> = [{value: "", label: "All statuses"}, {value: "SHARE_ACCOUNT_STATUS_ACTIVE", label: "Active"}, {value: "SHARE_ACCOUNT_STATUS_DORMANT", label: "Dormant"}, {value: "SHARE_ACCOUNT_STATUS_CLOSED", label: "Closed"}];

// ShareDirectoryHeader keeps the page's single hero and search toolbar together.
export function ShareDirectoryHeader({lookup, lookupBy, status}: {lookup: string; lookupBy: string; status: string}) {
  return <>
    <section className="overflow-hidden rounded-2xl bg-linear-to-r from-[#961521] to-[#c8242f] px-6 py-7 text-white shadow-[0_16px_45px_rgba(153,27,39,0.16)] sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-100"><Building2 className="size-4" />Branch 01 · Share administration</div><h1 className="text-3xl font-bold tracking-tight">Share accounts</h1><p className="mt-2 text-sm text-red-50/85">Manage member share capital and account activity.</p></div><OpenAccountDialog /></div></section>
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"><form className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]" method="get"><select aria-label="Lookup field" className="h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm" defaultValue={lookupBy} name="lookupBy"><option value="memberNumber">Member number</option><option value="nationalId">National ID</option></select><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><input className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm outline-none focus:border-[#a91521]" defaultValue={lookup} name="lookup" placeholder={lookupBy === "nationalId" ? "Enter exact national ID" : "Enter exact member number"} /></div><button className="h-11 rounded-lg bg-stone-900 px-5 text-sm font-semibold text-white" type="submit">Find account</button></form><form className="flex gap-2" method="get"><select aria-label="Filter by status" className="h-11 min-w-40 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm" defaultValue={status} name="status">{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className="h-11 rounded-lg border border-stone-200 px-4 text-sm font-semibold" type="submit">Apply</button></form></div></section>
  </>;
}
