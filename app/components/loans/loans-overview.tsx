"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChevronDown } from "lucide-react";

// import { loanData } from "../../data/loans";
import { formatCurrency } from "../../../lib/format-currency";
import type { Loan } from "@/app/types/loans";

export function LoansOverview({ loans }: { loans: Loan[] }) {
  const loanData = loans.map((loan) => ({
    amount: Number(loan.principal),
    month: new Date(loan.created_at).toLocaleDateString("en-KE", {
      month: "short",
    }),
  }));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Loans Overview</h2>

        <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium">
          Last 6 Months
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={loanData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c51f25" stopOpacity={0.18} />

                <stop offset="100%" stopColor="#c51f25" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#eeeeee"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{
                fontSize: 12,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={formatCurrency}
              tick={{
                fontSize: 12,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip
              formatter={(value) => [
                `KES ${Number(value).toLocaleString()}`,
                "Loans",
              ]}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#c51f25"
              strokeWidth={2.5}
              fill="url(#loanGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
