import Link from "next/link";
import { ArrowLeft, Banknote } from "lucide-react";

import type { Loan } from "@/lib/go-api-client";
import { LoanBadge } from "./loan-badges";
import { LoanLifecycleActions } from "./loan-lifecycle-actions";

// LoanHeader keeps loan identity, state, and currently valid actions in one visible place.
export function LoanHeader({ loan }: { loan: Loan }) {
  const canRepay =
    loan.status === "LOAN_STATUS_ACTIVE" ||
    loan.status === "LOAN_STATUS_DELINQUENT" ||
    loan.status === "LOAN_STATUS_DISBURSED";
  return (
    <section className="rounded-2xl bg-linear-to-r from-[#961521] to-[#c8242f] px-6 py-6 text-white shadow-sm sm:px-8">
      <Link
        className="inline-flex hover:bg-white px-4 py-2 hover:text-black rounded-2xl items-center gap-2 text-sm font-semibold text-red-100"
        href="/dashboard/loans"
      >
        <ArrowLeft className="size-4" />
        Loans
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <LoanBadge status={loan.status} />
          <h1 className="mt-3 wrap-break-words font-mono text-2xl font-bold sm:text-3xl">
            {loan.memberName || "Member loan"}
          </h1>
          <p className="mt-2 break-all font-mono text-sm text-red-100">
            Member No: {loan.memberNumber || loan.memberId}
          </p>
          {/* <p className="mt-1 break-all font-mono text-xs text-red-100">
            Loan {loan.id}
          </p> */}
        </div>
        <div className="flex flex-wrap gap-2">
          <LoanLifecycleActions loanId={loan.id} status={loan.status} />
          {canRepay ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#a91521]"
              href="/dashboard/contributions"
            >
              <Banknote className="size-4" />
              Record repayment
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
