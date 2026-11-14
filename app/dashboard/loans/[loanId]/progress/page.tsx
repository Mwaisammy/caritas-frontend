import { notFound } from "next/navigation";

import { LoanProgress } from "@/app/components/loans-ui/loan-progress";
import { GoApiError } from "@/lib/server/go-api";
import { getLoan } from "@/lib/server/loans-api";
import { getMember } from "@/lib/server/members-api";

// LoanProgressPage shows the application outcome before admins open the full loan workspace.
export default async function LoanProgressPage({ params }: { params: Promise<{ loanId: string }> }) {
  const { loanId } = await params;
  let result;
  try {
    result = await getLoan({ loanId });
  } catch (error) {
    if (error instanceof GoApiError && error.status === 404) notFound();
    throw error;
  }
  if (!result.loan) notFound();

  let memberName = "Member loan";
  try {
    const member = await getMember({ branchId: result.loan.branchId, memberId: result.loan.memberId });
    memberName = member.member?.profile?.personal?.fullName || member.member?.memberNumber || memberName;
  } catch {
    // Loan progress still works when member details cannot be loaded.
  }

  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 pt-6 sm:px-7 lg:px-9">
      <LoanProgress loan={result.loan} memberName={memberName} memberId={result.loan.memberId} />
    </div>
  );
}
