import { LoansStats } from "@/app/components/loans/loan-stats";
import { LoansOverview } from "@/app/components/loans/loans-overview";
import { LoansWelcome } from "@/app/components/loans/loans-welcome";
import { RecentApplications } from "@/app/components/loans/recent-applications";
import { getLoans } from "@/lib/api/loans";
import { getMember } from "@/lib/server/members-api";

export default async function LoansPage() {
  const loanData = await getLoans();
  const members = await Promise.all(
    [...new Map(loanData.loans.map((loan) => [loan.memberId, loan])).values()].map(
      (loan) =>
        getMember({branchId: loan.branchId, memberId: loan.memberId}).then(
          ({member}) => member,
        ),
    ),
  );
  const membersById = new Map(members.filter(Boolean).map((member) => [member!.id, member!]));
  const loans = loanData.loans.map((loan) => ({
    ...loan,
    memberName: membersById.get(loan.memberId)?.profile?.personal?.fullName,
    memberNumber: membersById.get(loan.memberId)?.memberNumber,
  }));
  const activeLoans = loans.filter(
    (loan) => loan.status === "LOAN_STATUS_ACTIVE",
  );

  return (
    <div className="min-h-screen  text-gray-900">
      <main className="">
        {/* <LoansHeader /> */}

        <div className="p-6 lg:p-7">
          <LoansWelcome />

          <LoansStats loans={loans} />

          <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
            <LoansOverview loans={activeLoans} />
            {/* <UpcomingRepayments /> */}
          </section>

          <RecentApplications loans={loans} />
        </div>
      </main>
    </div>
  );
}
