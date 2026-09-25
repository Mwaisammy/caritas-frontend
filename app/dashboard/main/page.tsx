"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  HandCoins,
  PiggyBank,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Preview values only. Replace these datasets with authenticated, branch-scoped
// API responses before using the dashboard for operational decisions.
const cashFlow = [
  { month: "Apr", collections: 640, disbursements: 510 },
  { month: "May", collections: 690, disbursements: 590 },
  { month: "Jun", collections: 730, disbursements: 550 },
  { month: "Jul", collections: 710, disbursements: 650 },
  { month: "Aug", collections: 810, disbursements: 670 },
  { month: "Sep", collections: 860, disbursements: 720 },
];

const shareMovement = [
  { month: "Apr", purchased: 165, redeemed: 42 },
  { month: "May", purchased: 189, redeemed: 55 },
  { month: "Jun", purchased: 178, redeemed: 48 },
  { month: "Jul", purchased: 214, redeemed: 61 },
  { month: "Aug", purchased: 232, redeemed: 72 },
  { month: "Sep", purchased: 248, redeemed: 59 },
];

const loanMix = [
  { name: "Active", value: 68, color: "#9e1c2a" },
  { name: "Pending", value: 17, color: "#f1b651" },
  { name: "Overdue", value: 9, color: "#ec7a7a" },
  { name: "Closed", value: 6, color: "#e6e2e2" },
];

const compactMoney = (value: number) => `KES ${value.toLocaleString("en-KE")}k`;

const metrics = [
  { label: "Outstanding loans", value: "KES 1.86M", change: "+8.2%", context: "from last month", icon: HandCoins, tone: "text-[#ad2a39] bg-red-50", href: "/dashboard/loans" },
  { label: "Share capital", value: "KES 8.42M", change: "+5.4%", context: "from last month", icon: PiggyBank, tone: "text-amber-700 bg-amber-50", href: "/dashboard/shares" },
  { label: "Active members", value: "1,248", change: "+32", context: "new this month", icon: UsersRound, tone: "text-sky-700 bg-sky-50", href: "/dashboard/members" },
  { label: "Dividends paid", value: "KES 873.6k", change: "86.5%", context: "of declared amount", icon: Wallet, tone: "text-emerald-700 bg-emerald-50", href: "/dashboard/dividends" },
];

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#b72736] transition hover:text-[#8f1f2b] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b72736]">{children}<ArrowRight className="size-3.5" /></Link>;
}

export default function MainPage() {
  return (
    <div className="min-h-screen space-y-5 px-5 pb-12 text-gray-900 sm:px-7">
      <section className="relative overflow-hidden rounded-[1.6rem] bg-[#7f1d2a] px-6 py-7 text-white shadow-[0_16px_36px_rgba(108,28,41,0.14)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-28 size-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-11 size-56 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">Administration overview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your cooperative at a glance</h1>
            <p className="mt-3 text-sm leading-6 text-rose-100/90">Keep an eye on lending, member ownership and payouts in one place.</p>
            <span className="mt-5 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white">Sample data · UI preview</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className="rounded-xl bg-white/15 p-2.5"><ArrowUpRight className="size-5" /></span>
            <div><p className="text-xs text-rose-100">Collections this month</p><p className="text-xl font-semibold">KES 860k</p></div>
          </div>
        </div>
      </section>

      <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <Link key={metric.label} href={metric.href} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition hover:border-red-100 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b72736]">
          <div className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-slate-500">{metric.label}</span><span className={`rounded-xl p-2.5 ${metric.tone}`}><metric.icon className="size-5" /></span></div>
          <p className="mt-4 text-2xl font-semibold tracking-tight">{metric.value}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs"><span className="font-semibold text-emerald-700">{metric.change}</span><span className="text-slate-500">{metric.context}</span><ArrowRight className="ml-auto size-4 text-slate-400 transition group-hover:translate-x-1" /></div>
        </Link>)}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <section aria-labelledby="cash-heading" className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="cash-heading" className="text-lg font-semibold">Lending cash flow</h2><p className="mt-1 text-xs text-slate-500">Collections and disbursements · KES thousands</p></div><span className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-slate-600">Last 6 months</span></div>
          <div className="mt-6 h-72 w-full" role="img" aria-label="Area chart: collections rise from 640 to 860 thousand shillings; disbursements rise from 510 to 720 thousand shillings between April and September">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs><linearGradient id="collectionsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b72736" stopOpacity={0.24} /><stop offset="100%" stopColor="#b72736" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#f0eeee" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value: number) => `${value}k`} width={50} />
                <Tooltip formatter={(value, name) => [compactMoney(Number(value)), name === "collections" ? "Collections" : "Disbursements"]} contentStyle={{ borderRadius: 12, borderColor: "#f1eeee", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => value === "collections" ? "Collections" : "Disbursements"} />
                <Area name="collections" type="monotone" dataKey="collections" stroke="#b72736" strokeWidth={2.5} fill="url(#collectionsFill)" />
                <Area name="disbursements" type="monotone" dataKey="disbursements" stroke="#e8a878" strokeWidth={2.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="portfolio-heading" className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 id="portfolio-heading" className="text-lg font-semibold">Loan portfolio mix</h2><p className="mt-1 text-xs text-slate-500">Share of loans by status</p></div><SectionLink href="/dashboard/loans">View loans</SectionLink></div>
          <div className="relative mt-5 h-56 w-full" role="img" aria-label="Donut chart: 68% active, 17% pending, 9% overdue, and 6% closed loans">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={loanMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">{loanMix.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => `${value}%`} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold">68%</span><span className="text-xs text-slate-500">active</span></div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{loanMix.map((item) => <div key={item.name} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <section aria-labelledby="shares-heading" className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="shares-heading" className="text-lg font-semibold">Share movement</h2><p className="mt-1 text-xs text-slate-500">Shares purchased and redeemed each month</p></div><SectionLink href="/dashboard/shares">View shares</SectionLink></div>
          <div className="mt-6 h-64 w-full" role="img" aria-label="Grouped bar chart: purchases exceed redemptions in every month from April through September">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={shareMovement} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid vertical={false} stroke="#f0eeee" strokeDasharray="4 4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} width={46} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: "#f1eeee", fontSize: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => value === "purchased" ? "Purchased" : "Redeemed"} /><Bar dataKey="purchased" fill="#b72736" radius={[5, 5, 0, 0]} maxBarSize={26} /><Bar dataKey="redeemed" fill="#efb782" radius={[5, 5, 0, 0]} maxBarSize={26} />
            </BarChart></ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="attention-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="flex items-center gap-2"><CircleAlert className="size-5 text-[#b72736]" /><h2 id="attention-heading" className="text-lg font-semibold">Needs attention</h2></div>
          <p className="mt-1 text-xs text-slate-500">Sample operational queue</p>
          <div className="mt-6 space-y-3">
            <Link href="/dashboard/loans" className="group flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 transition hover:bg-amber-50"><span className="rounded-lg bg-white p-2 text-amber-700"><HandCoins className="size-4" /></span><span className="flex-1"><strong className="block text-sm">17 loan applications</strong><span className="text-xs text-slate-500">Waiting for review</span></span><ArrowRight className="size-4 text-slate-400 group-hover:text-amber-700" /></Link>
            <Link href="/dashboard/loans" className="group flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/70 p-3 transition hover:bg-red-50"><span className="rounded-lg bg-white p-2 text-red-700"><CircleAlert className="size-4" /></span><span className="flex-1"><strong className="block text-sm">9% of loans overdue</strong><span className="text-xs text-slate-500">Monitor repayment risk</span></span><ArrowRight className="size-4 text-slate-400 group-hover:text-red-700" /></Link>
            <Link href="/dashboard/dividends" className="group flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3 transition hover:bg-sky-50"><span className="rounded-lg bg-white p-2 text-sky-700"><Wallet className="size-4" /></span><span className="flex-1"><strong className="block text-sm">13.5% dividends pending</strong><span className="text-xs text-slate-500">Complete the payout cycle</span></span><ArrowRight className="size-4 text-slate-400 group-hover:text-sky-700" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
