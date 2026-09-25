"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  Coins,
  PiggyBank,
  Search,
  UsersRound,
} from "lucide-react";

type ShareEntry = {
  id: string;
  member: string;
  memberNumber: string;
  type: "Purchase" | "Transfer" | "Redemption";
  shares: number;
  amount: number;
  date: string;
  status: "Completed" | "Pending";
};

// UI preview records. Replace with authenticated backend data when the shares API is ready.
const entries: ShareEntry[] = [
  {
    id: "SH-1048",
    member: "Mary Wanjiku",
    memberNumber: "MEM-00241",
    type: "Purchase",
    shares: 50,
    amount: 5000,
    date: "2026-09-18",
    status: "Completed",
  },
  {
    id: "SH-1047",
    member: "Peter Otieno",
    memberNumber: "MEM-00186",
    type: "Purchase",
    shares: 30,
    amount: 3000,
    date: "2026-09-17",
    status: "Completed",
  },
  {
    id: "SH-1046",
    member: "Grace Njeri",
    memberNumber: "MEM-00305",
    type: "Transfer",
    shares: 20,
    amount: 2000,
    date: "2026-09-16",
    status: "Pending",
  },
  {
    id: "SH-1045",
    member: "John Mwangi",
    memberNumber: "MEM-00098",
    type: "Redemption",
    shares: 15,
    amount: 1500,
    date: "2026-09-15",
    status: "Completed",
  },
];

const trend = [
  { month: "Apr", value: 42 },
  { month: "May", value: 59 },
  { month: "Jun", value: 51 },
  { month: "Jul", value: 72 },
  { month: "Aug", value: 66 },
  { month: "Sep", value: 86 },
];

const currency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

export default function SharesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All activity");
  const visible = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesType = filter === "All activity" || entry.type === filter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          [entry.member, entry.memberNumber, entry.id].some((value) =>
            value.toLowerCase().includes(query),
          );
        return matchesType && matchesSearch;
      }),
    [search, filter],
  );

  const stats = [
    {
      label: "Total share capital",
      value: "KES 8,420,000",
      detail: "Value held by members",
      icon: PiggyBank,
      color: "bg-red-50 text-[#c51f25]",
    },
    {
      label: "Shares issued",
      value: "84,200",
      detail: "Across all members",
      icon: Coins,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Shareholders",
      value: "1,248",
      detail: "Members with shares",
      icon: UsersRound,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Share price",
      value: "KES 100",
      detail: "Per share",
      icon: ChartNoAxesCombined,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen p-6 text-gray-900 lg:p-7">
      <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:px-7">
        <div className="relative z-10">
          <p className="text-sm font-medium text-slate-500">Member ownership</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Shares</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Track share capital, member ownership and recent share activity.
          </p>
          <span className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            Sample data · UI preview
          </span>
        </div>
        <div className="absolute right-10 top-1/2 hidden size-28 -translate-y-1/2 items-center justify-center rounded-full bg-red-50 text-[#c51f25] md:flex">
          <PiggyBank className="size-16" strokeWidth={1.4} />
        </div>
      </section>

      <section
        aria-label="Share summary"
        className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <span className={`rounded-xl p-2.5 ${item.color}`}>
                <item.icon className="size-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section
          aria-labelledby="growth-heading"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="growth-heading" className="text-lg font-semibold">
                Share capital growth
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Illustrative monthly activity
              </p>
            </div>
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-slate-600">
              Last 6 months
            </span>
          </div>
          <div className="mt-8 flex h-56 items-end gap-3 border-b border-gray-100 px-2 sm:gap-6">
            {trend.map((item) => (
              <div
                key={item.month}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-semibold text-slate-500">
                  {item.value}%
                </span>
                <div
                  style={{ height: `${item.value}%` }}
                  className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#c51f25] to-[#f19b9e] transition-colors group-hover:from-[#9e1a1f]"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 px-2 text-center text-xs text-slate-500 sm:gap-6">
            {trend.map((item) => (
              <span key={item.month} className="flex-1">
                {item.month}
              </span>
            ))}
          </div>
        </section>
        <section
          aria-labelledby="snapshot-heading"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
        >
          <h2 id="snapshot-heading" className="text-lg font-semibold">
            Ownership snapshot
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            How shares are distributed
          </p>
          <div className="mt-7 flex items-center gap-5">
            <div className="flex size-32 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#c51f25_0_64%,#ef9a9d_64%_87%,#f5d8d9_87%_100%)]">
              <div className="flex size-21 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-xl font-semibold">1,248</span>
                <span className="text-[10px] text-slate-500">members</span>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <p>
                <span className="mr-2 inline-block size-2.5 rounded-full bg-[#c51f25]" />
                Individual members <strong className="ml-1">64%</strong>
              </p>
              <p>
                <span className="mr-2 inline-block size-2.5 rounded-full bg-[#ef9a9d]" />
                Groups <strong className="ml-1">23%</strong>
              </p>
              <p>
                <span className="mr-2 inline-block size-2.5 rounded-full bg-[#f5d8d9]" />
                Other <strong className="ml-1">13%</strong>
              </p>
            </div>
          </div>
          <div className="mt-7 rounded-xl bg-red-50 p-4">
            <p className="text-xs font-medium text-[#a32329]">
              Share capital at a glance
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Every share contributes to member ownership and long term
              cooperative growth.
            </p>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="activity-heading"
        className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="activity-heading" className="text-lg font-semibold">
              Recent share activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Purchases, transfers and redemptions
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search share activity</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member or ID"
                className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#c51f25] sm:w-56"
              />
            </label>
            <label>
              <span className="sr-only">Filter share activity</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#c51f25]"
              >
                <option>All activity</option>
                <option>Purchase</option>
                <option>Transfer</option>
                <option>Redemption</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Member
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Activity
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Shares
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <span className="block font-medium">{entry.member}</span>
                    <span className="text-xs text-slate-500">
                      {entry.memberNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{entry.id}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {entry.type === "Redemption" ? (
                        <ArrowDownLeft className="size-4 text-amber-600" />
                      ) : (
                        <ArrowUpRight className="size-4 text-emerald-600" />
                      )}
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.shares}</td>
                  <td className="px-4 py-3 font-medium">
                    {currency(entry.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Intl.DateTimeFormat("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(entry.date))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No activity matches your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
