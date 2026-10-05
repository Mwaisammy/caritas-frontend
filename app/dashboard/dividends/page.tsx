"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  Coins,
  Search,
  UsersRound,
  Wallet,
} from "lucide-react";

type DividendPayout = {
  id: string;
  member: string;
  memberNumber: string;
  period: string;
  shares: number;
  amount: number;
  date: string;
  status: "Paid" | "Pending";
};

// Illustrative records for the UI preview. Connect an authenticated dividends
// query before using this page for real financial reporting.
const payouts: DividendPayout[] = [
  { id: "DIV-2084", member: "Mary Wanjiku", memberNumber: "MEM-00241", period: "2025", shares: 180, amount: 2160, date: "2026-04-19", status: "Paid" },
  { id: "DIV-2083", member: "Peter Otieno", memberNumber: "MEM-00186", period: "2025", shares: 125, amount: 1500, date: "2026-04-19", status: "Paid" },
  { id: "DIV-2082", member: "Grace Njeri", memberNumber: "MEM-00305", period: "2025", shares: 96, amount: 1152, date: "2026-04-18", status: "Pending" },
  { id: "DIV-2081", member: "John Mwangi", memberNumber: "MEM-00098", period: "2025", shares: 210, amount: 2520, date: "2026-04-18", status: "Paid" },
  { id: "DIV-2080", member: "Faith Achieng", memberNumber: "MEM-00277", period: "2025", shares: 75, amount: 900, date: "2026-04-17", status: "Pending" },
];

const monthlyPayouts = [
  { month: "Nov", value: 28 },
  { month: "Dec", value: 42 },
  { month: "Jan", value: 36 },
  { month: "Feb", value: 53 },
  { month: "Mar", value: 71 },
  { month: "Apr", value: 88 },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function DividendsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payouts.filter(
      (payout) =>
        (status === "All statuses" || payout.status === status) &&
        (!query ||
          [payout.member, payout.memberNumber, payout.id].some((value) =>
            value.toLowerCase().includes(query),
          )),
    );
  }, [search, status]);

  const stats = [
    { label: "Total declared", value: "KES 1,010,400", detail: "2025 distribution", icon: Coins, color: "bg-red-50 text-[#c51f25]" },
    { label: "Paid out", value: "KES 873,600", detail: "86.5% of declared amount", icon: Wallet, color: "bg-emerald-50 text-emerald-700" },
    { label: "Pending payout", value: "KES 136,800", detail: "Awaiting settlement", icon: Clock3, color: "bg-amber-50 text-amber-700" },
    { label: "Eligible members", value: "1,248", detail: "In this distribution", icon: UsersRound, color: "bg-blue-50 text-blue-700" },
  ];

  return (
    <div className="min-h-screen p-6 text-gray-900 lg:p-7">
      <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:px-7">
        <div className="relative z-10">
          <p className="text-sm font-medium text-slate-500">Member returns</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dividends</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Follow dividend declarations, member payouts and distribution progress.
          </p>
          <span className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            Sample data · UI preview
          </span>
        </div>
        <div className="absolute right-10 top-1/2 hidden size-28 -translate-y-1/2 items-center justify-center rounded-full bg-red-50 text-[#c51f25] md:flex">
          <Wallet className="size-16" strokeWidth={1.4} />
        </div>
      </section>

      <section aria-label="Dividend summary" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <span className={`rounded-xl p-2.5 ${item.color}`}><item.icon className="size-5" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section aria-labelledby="distribution-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="distribution-heading" className="text-lg font-semibold">Distribution activity</h2>
              <p className="mt-1 text-xs text-slate-500">Illustrative payout volume by month</p>
            </div>
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-slate-600">Last 6 months</span>
          </div>
          <div className="mt-8 flex h-56 items-end gap-3 border-b border-gray-100 px-2 sm:gap-6">
            {monthlyPayouts.map((item) => (
              <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-slate-500">{item.value}%</span>
                <div style={{ height: `${item.value}%` }} className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#c51f25] to-[#f19b9e]" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 px-2 text-center text-xs text-slate-500 sm:gap-6">
            {monthlyPayouts.map((item) => <span key={item.month} className="flex-1">{item.month}</span>)}
          </div>
        </section>

        <section aria-labelledby="cycle-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-3">
            <div><h2 id="cycle-heading" className="text-lg font-semibold">Distribution cycle</h2><p className="mt-1 text-xs text-slate-500">2025 financial year</p></div>
            <span className="rounded-xl bg-red-50 p-2.5 text-[#c51f25]"><CalendarDays className="size-5" /></span>
          </div>
          <div className="mt-7 flex items-center justify-between text-sm"><span className="font-medium text-gray-800">Payout progress</span><span className="font-semibold text-[#c51f25]">86.5%</span></div>
          <div role="progressbar" aria-label="Payout progress" aria-valuenow={86.5} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2.5 overflow-hidden rounded-full bg-red-100"><div className="h-full w-[86.5%] rounded-full bg-[#c51f25]" /></div>
          <div className="mt-7 space-y-4 border-t border-gray-100 pt-5 text-sm">
            <div className="flex items-center gap-3"><CircleCheck className="size-5 text-emerald-600" /><div className="flex-1"><p className="font-medium">Dividend declared</p><p className="text-xs text-slate-500">2025 distribution approved</p></div><span className="text-xs text-slate-500">Complete</span></div>
            <div className="flex items-center gap-3"><CircleCheck className="size-5 text-emerald-600" /><div className="flex-1"><p className="font-medium">Member payouts</p><p className="text-xs text-slate-500">Most payments settled</p></div><span className="text-xs text-slate-500">In progress</span></div>
            <div className="flex items-center gap-3"><Clock3 className="size-5 text-amber-600" /><div className="flex-1"><p className="font-medium">Final reconciliation</p><p className="text-xs text-slate-500">After pending payments clear</p></div><span className="text-xs text-slate-500">Upcoming</span></div>
          </div>
        </section>
      </div>

      <section aria-labelledby="payouts-heading" className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h2 id="payouts-heading" className="text-lg font-semibold">Recent member payouts</h2><p className="mt-1 text-xs text-slate-500">Payment records for the latest distribution</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><span className="sr-only">Search payouts</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member or ID" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#c51f25] sm:w-56" /></label>
            <label><span className="sr-only">Filter payout status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#c51f25]"><option>All statuses</option><option>Paid</option><option>Pending</option></select></label>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500"><tr><th scope="col" className="px-4 py-3 font-medium">Member</th><th scope="col" className="px-4 py-3 font-medium">Reference</th><th scope="col" className="px-4 py-3 font-medium">Period</th><th scope="col" className="px-4 py-3 font-medium">Shares</th><th scope="col" className="px-4 py-3 font-medium">Dividend</th><th scope="col" className="px-4 py-3 font-medium">Date</th><th scope="col" className="px-4 py-3 font-medium">Status</th></tr></thead>
            <tbody>
              {visible.map((payout) => <tr key={payout.id} className="border-t border-gray-100">
                <td className="px-4 py-3"><span className="block font-medium">{payout.member}</span><span className="text-xs text-slate-500">{payout.memberNumber}</span></td>
                <td className="px-4 py-3 text-slate-500">{payout.id}</td><td className="px-4 py-3 text-slate-500">{payout.period}</td><td className="px-4 py-3">{payout.shares}</td>
                <td className="px-4 py-3 font-medium">{money(payout.amount)}</td><td className="px-4 py-3 text-slate-500">{dateLabel(payout.date)}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${payout.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{payout.status === "Paid" && <ArrowUpRight className="size-3" />}{payout.status}</span></td>
              </tr>)}
              {visible.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No payouts match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
