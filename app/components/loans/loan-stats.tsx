import { CreditCard, FileClock, PieChart, Users } from "lucide-react";

import { LoanStatCard } from "./loan-stat-card";

export function LoansStats() {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <LoanStatCard
        title="Total Loans"
        amount="KES 3,480,000"
        percentage="12.5%"
        direction="up"
        icon={<CreditCard size={23} />}
      />

      <LoanStatCard
        title="Active Loans"
        amount="KES 2,180,000"
        percentage="8.7%"
        direction="up"
        icon={<PieChart size={23} />}
      />

      <LoanStatCard
        title="Pending Applications"
        amount="KES 420,000"
        percentage="16.7%"
        direction="up"
        icon={<FileClock size={23} />}
      />

      <LoanStatCard
        title="Outstanding Balance"
        amount="KES 1,860,000"
        percentage="5.2%"
        direction="down"
        icon={<Users size={23} />}
      />
    </section>
  );
}
