import { HandCoins } from "lucide-react";
import Link from "next/link";

export function LoansWelcome() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="relative z-10">
        <p className="text-lg font-medium text-slate-500">Welcome back,</p>

        <h2 className="mt-1 text-[30px] font-semibold">Loans</h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage loan applications, disbursements and repayments.
        </p>
      </div>

      <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 opacity-40 md:block">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#fff1f2]">
          <HandCoins size={70} className="text-[#c51f25]" />
        </div>
      </div>

    {/* <Link
  href="/dashboard/members"
  className="absolute right-6 top-1/2 flex -translate-y-1/2 cursor-pointer items-center gap-2 rounded-lg bg-[#c51f25] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#aa1b20]"
>
  <span className="text-xl">+</span>
  New Loan
</Link> */}

    </section>
  );
}
