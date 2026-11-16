import Link from "next/link";
import { CheckIcon } from "lucide-react";

import type { LoanStatus } from "@/lib/go-api-client";
import { formatLoanDate, formatLoanMoney, loanLabel } from "./loan-badges";

const steps = ["Applied", "Decision", "Money sent"];

// LoanProgress maps the existing loan status to the three milestones admins need to follow.
export function LoanProgress({ loan, memberName, memberId }: { loan: { id: string; principal: string; status: LoanStatus; createdAt: string }; memberName: string; memberId: string }) {
  const rejected = loan.status === "LOAN_STATUS_REJECTED";
  const manualReview = loan.status === "LOAN_STATUS_MANUAL_REVIEW";
  const index = loan.status === "LOAN_STATUS_PENDING" || manualReview ? 1
    : loan.status === "LOAN_STATUS_APPROVED" || rejected ? 2
      : 3;
  const message = rejected ? "This application was declined."
    : manualReview ? "This application needs another look."
      : loan.status === "LOAN_STATUS_PENDING" ? "Waiting for a decision."
        : loan.status === "LOAN_STATUS_APPROVED" ? "Approved. The loan is ready to be sent."
          : loan.status === "LOAN_STATUS_DISBURSED" ? "The money has been sent. Repayment will start next."
            : loan.status === "LOAN_STATUS_ACTIVE" || loan.status === "LOAN_STATUS_DELINQUENT" ? "The loan has moved to repayment."
              : `Loan status: ${loanLabel(loan.status)}.`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link className="text-sm font-medium text-[#a91521] underline" href={`/dashboard/members/${encodeURIComponent(memberId)}`}>Back to member</Link>
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <p className="text-sm text-muted-foreground">Loan application</p>
        <h1 className="mt-1 text-2xl font-bold">{memberName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatLoanMoney(loan.principal)} · Submitted {formatLoanDate(loan.createdAt)}</p>

        <nav aria-label="Loan progress" className="mt-8 rounded-xl bg-background p-4 ring-1 ring-foreground/10 sm:p-5">
          <ol className="grid grid-cols-3">
            {steps.map((label, stepIndex) => {
              const complete = stepIndex < index;
              const active = stepIndex === index && !rejected && index < steps.length;
              const lineComplete = stepIndex <= index && !(rejected && stepIndex === 2);
              return (
                <li aria-current={active ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center" key={label}>
                  {stepIndex > 0 ? <span aria-hidden="true" className={`absolute left-[-50%] right-[calc(50%+1rem)] top-4 h-0.5 ${lineComplete ? "bg-rose-800" : "bg-muted"}`} /> : null}
                  <span className={`relative z-10 flex size-8 items-center justify-center rounded-full text-sm ring-4 ring-background ${complete || active ? "bg-rose-800 text-white" : "bg-muted text-muted-foreground"}`}>
                    {complete ? <CheckIcon aria-hidden="true" className="size-4" /> : stepIndex + 1}
                  </span>
                  <span className={`text-xs ${active ? "font-semibold text-rose-800" : "text-muted-foreground"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6 rounded-xl bg-rose-50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">{rejected ? "Application finished" : manualReview ? "Needs attention" : index < steps.length ? `Step ${index + 1} of 3` : "Loan progress"}</p>
          <p className="mt-1 font-semibold text-stone-950">{message}</p>
          <p className="mt-1 text-sm text-stone-600">Open the loan page to see details and available actions.</p>
          <Link className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#a91521] px-4 text-sm font-semibold text-white" href={`/dashboard/loans/${encodeURIComponent(loan.id)}`}>Open loan page</Link>
        </div>
      </section>
    </div>
  );
}
