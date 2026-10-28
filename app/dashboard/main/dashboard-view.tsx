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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const unavailable = "Unavailable";

// Props carry server-fetched values into the existing chart UI.
type DashboardData = {
  outstandingLoans: string | null;
  activeMembers: number | null;
  loanMix: { name: string; value: number; color: string }[] | null;
  pendingApplications: number | null;
  delinquentPercent: number | null;
};

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-[#b72736] transition hover:text-[#8f1f2b] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b72736]"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

export default function MainPage({ data }: { data: DashboardData }) {
  const metrics = [
    {
      label: "Outstanding loans",
      value: data.outstandingLoans ?? unavailable,
      context:
        data.outstandingLoans === null
          ? "Loan data unavailable"
          : "Current principal balance",
      icon: HandCoins,
      tone: "text-[#ad2a39] bg-red-50",
      href: "/dashboard/loans",
    },
    {
      label: "Share capital",
      value: unavailable,
      context: "No branch total available",
      icon: PiggyBank,
      tone: "text-amber-700 bg-amber-50",
      href: "/dashboard/shares",
    },
    {
      label: "Active members",
      value: data.activeMembers?.toLocaleString("en-KE") ?? unavailable,
      context:
        data.activeMembers === null
          ? "Member data unavailable"
          : "Current active members",
      icon: UsersRound,
      tone: "text-sky-700 bg-sky-50",
      href: "/dashboard/members",
    },
    {
      label: "Dividends paid",
      value: unavailable,
      context: "No branch total available",
      icon: Wallet,
      tone: "text-emerald-700 bg-emerald-50",
      href: "/dashboard/dividends",
    },
  ];
  return (
    <div className="min-h-screen space-y-5 px-5 pb-12 text-gray-900 sm:px-7">
      <section className="relative overflow-hidden rounded-[1.6rem] bg-[#7f1d2a] px-6 py-7 text-white shadow-[0_16px_36px_rgba(108,28,41,0.14)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-28 size-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-11 size-56 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xl font-semibold uppercase tracking-[0.22em] text-rose-200">
              Admin Dashboard
            </p>

            <p className="mt-3 text-sm leading-6 text-rose-100/90">
              Manage your cooperative in one place.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className="rounded-xl bg-white/15 p-2.5">
              <ArrowUpRight className="size-5" />
            </span>
            <div>
              <p className="text-xs text-rose-100">Collections this month</p>
              <p className="text-xl font-semibold">{unavailable}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Key performance indicators"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition hover:border-red-100 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b72736]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-slate-500">
                {metric.label}
              </span>
              <span className={`rounded-xl p-2.5 ${metric.tone}`}>
                <metric.icon className="size-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {metric.value}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">{metric.context}</span>
              <ArrowRight className="ml-auto size-4 text-slate-400 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <section
          aria-labelledby="cash-heading"
          className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="cash-heading" className="text-lg font-semibold">
                Lending cash flow
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Collections and disbursements · KES thousands
              </p>
            </div>
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-slate-600">
              Last 6 months
            </span>
          </div>
          <div className="mt-6 flex h-72 items-center justify-center text-sm text-slate-500">
            Collection history is not available yet.
          </div>
        </section>

        <section
          aria-labelledby="portfolio-heading"
          className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="portfolio-heading" className="text-lg font-semibold">
                Loan portfolio mix
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Share of loans by status
              </p>
            </div>
            <SectionLink href="/dashboard/loans">View loans</SectionLink>
          </div>
          {data.loanMix ? (
            <>
              <div
                className="relative mt-5 h-56 w-full"
                role="img"
                aria-label="Donut chart showing the share of loans by status"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.loanMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {data.loanMix.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold">
                    {data.loanMix.find((item) => item.name === "Active")
                      ?.value ?? 0}
                    %
                  </span>
                  <span className="text-xs text-slate-500">active</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {data.loanMix.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <strong>{item.value}%</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-5 flex h-56 items-center justify-center text-sm text-slate-500">
              Loan data is unavailable.
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <section
          aria-labelledby="shares-heading"
          className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="shares-heading" className="text-lg font-semibold">
                Share movement
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Shares purchased and redeemed each month
              </p>
            </div>
            <SectionLink href="/dashboard/shares">View shares</SectionLink>
          </div>
          <div className="mt-6 flex h-64 items-center justify-center text-sm text-slate-500">
            Share totals and transaction history are not available yet.
          </div>
        </section>

        <section
          aria-labelledby="attention-heading"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
        >
          <div className="flex items-center gap-2">
            <CircleAlert className="size-5 text-[#b72736]" />
            <h2 id="attention-heading" className="text-lg font-semibold">
              Needs attention
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Current loan review and delinquency counts
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/dashboard/loans"
              className="group flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 transition hover:bg-amber-50"
            >
              <span className="rounded-lg bg-white p-2 text-amber-700">
                <HandCoins className="size-4" />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  {data.pendingApplications ?? unavailable} loan applications
                </strong>
                <span className="text-xs text-slate-500">
                  Waiting for review
                </span>
              </span>
              <ArrowRight className="size-4 text-slate-400 group-hover:text-amber-700" />
            </Link>
            <Link
              href="/dashboard/loans"
              className="group flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/70 p-3 transition hover:bg-red-50"
            >
              <span className="rounded-lg bg-white p-2 text-red-700">
                <CircleAlert className="size-4" />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  {data.delinquentPercent === null
                    ? unavailable
                    : `${data.delinquentPercent}%`}{" "}
                  of loans overdue
                </strong>
                <span className="text-xs text-slate-500">
                  Monitor repayment risk
                </span>
              </span>
              <ArrowRight className="size-4 text-slate-400 group-hover:text-red-700" />
            </Link>
            <Link
              href="/dashboard/dividends"
              className="group flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3 transition hover:bg-sky-50"
            >
              <span className="rounded-lg bg-white p-2 text-sky-700">
                <Wallet className="size-4" />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  {unavailable} dividends pending
                </strong>
                <span className="text-xs text-slate-500">
                  Dividend totals are not available yet.
                </span>
              </span>
              <ArrowRight className="size-4 text-slate-400 group-hover:text-sky-700" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
