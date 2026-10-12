import { AlertTriangle, CreditCard, FileClock, PieChart } from "lucide-react";

import { LoanStatCard } from "./loan-stat-card";
import type { Loan } from "@/lib/go-api-client";

export function LoansStats({ loans }: { loans: Loan[] }) {
  const total = loans.reduce((sum, loan) => sum + Number(loan.principal), 0);
  const active = loans.filter((loan) => loan.status === "LOAN_STATUS_ACTIVE");
  const pending = loans.filter(
    (loan) =>
      loan.status === "LOAN_STATUS_PENDING" ||
      loan.status === "LOAN_STATUS_MANUAL_REVIEW",
  );
  const delinquent = loans.filter(
    (loan) => loan.status === "LOAN_STATUS_DELINQUENT",
  );
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <LoanStatCard
        title="Total Loans"
        amount={`KES ${total.toLocaleString("en-KE")}`}
        detail={`${loans.length} applications`}
        icon={<CreditCard size={23} />}
      />

      <LoanStatCard
        title="Active Loans"
        amount={`KES ${active.reduce((sum, loan) => sum + Number(loan.principal), 0).toLocaleString("en-KE")}`}
        detail={`${active.length} active`}
        icon={<PieChart size={23} />}
      />

      <LoanStatCard
        title="Pending Applications"
        amount={`KES ${pending.reduce((sum, loan) => sum + Number(loan.principal), 0).toLocaleString("en-KE")}`}
        detail={`${pending.length} pending`}
        icon={<FileClock size={23} />}
      />

      <LoanStatCard
        title="Delinquent Loans"
        amount={`KES ${delinquent.reduce((sum, loan) => sum + Number(loan.principal), 0).toLocaleString("en-KE")}`}
        detail={`${delinquent.length} delinquent`}
        icon={<AlertTriangle size={23} />}
      />
    </section>
  );
}
