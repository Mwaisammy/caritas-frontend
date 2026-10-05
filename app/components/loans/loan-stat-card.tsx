import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface LoanStatCardProps {
  title: string;
  amount: string;
  percentage: string;
  direction: "up" | "down";
  icon: ReactNode;
}

export function LoanStatCard({
  title,
  amount,
  percentage,
  direction,
  icon,
}: LoanStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>

          <h3 className="mt-5 text-[25px] font-semibold tracking-tight text-[#c51f25]">
            {amount}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fcebed] text-[#c51f25]">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        {direction === "up" ? (
          <ArrowUpRight size={17} className="text-green-600" />
        ) : (
          <ArrowDownRight size={17} className="text-green-600" />
        )}

        <span className="font-medium text-green-600">{percentage}</span>

        <span className="text-gray-500">from last month</span>
      </div>
    </div>
  );
}
