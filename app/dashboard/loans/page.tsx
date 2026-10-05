import { LoansStats } from "@/app/components/loans/loan-stats";
import { LoansOverview } from "@/app/components/loans/loans-overview";
import { LoansWelcome } from "@/app/components/loans/loans-welcome";
import { RecentApplications } from "@/app/components/loans/recent-applications";
import { getLoans } from "@/lib/api/loans";

export default async function LoansPage() {
  const loanData = await getLoans();

  console.log("Loans page data", loanData);

  return (
    <div className="min-h-screen  text-gray-900">
      <main className="">
        {/* <LoansHeader /> */}

        <div className="p-6 lg:p-7">
          <LoansWelcome />

          <LoansStats />

          <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
            <LoansOverview loans={loanData.loans} />
            {/* <UpcomingRepayments /> */}
          </section>

          <RecentApplications />
        </div>
      </main>
    </div>
  );
}
