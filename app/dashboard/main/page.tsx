import MainDashboard from "./dashboard-view";
import {getLoans} from "@/lib/api/loans";
import {listMembers} from "@/lib/server/members-api";
import {MEMBER_BRANCH_ID} from "@/app/dashboard/members/config";

// Cursor through the active member directory because its list endpoint has no total-count field.
async function getActiveMemberCount() {
  let count = 0;
  let pageToken = "";

  do {
    const page = await listMembers({
      branchId: MEMBER_BRANCH_ID,
      pageSize: 1000,
      statusFilter: "MEMBER_STATUS_ACTIVE",
      ...(pageToken ? {pageToken} : {}),
    });
    count += page.members?.length ?? 0;
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);

  return count;
}

export default async function MainPage() {
  const [loansResult, membersResult] = await Promise.allSettled([
    getLoans(),
    getActiveMemberCount(),
  ]);
  const loans =
    loansResult.status === "fulfilled" ? loansResult.value.loans : null;
  let outstandingPrincipal = 0;
  let outstandingAvailable = loans !== null;

  if (loans) {
    for (const loan of loans) {
      if (
        loan.status !== "LOAN_STATUS_DISBURSED" &&
        loan.status !== "LOAN_STATUS_ACTIVE" &&
        loan.status !== "LOAN_STATUS_DELINQUENT" &&
        loan.status !== "LOAN_STATUS_RESTRUCTURING" &&
        loan.status !== "LOAN_STATUS_MANUAL_REVIEW"
      ) {
        continue;
      }
      const balance =
        loan.financialSummary?.principalOutstanding ??
        loan.outstandingPrincipal;
      const amount = balance?.match(/^(\d+)(?:\.(\d{1,2}))?$/);
      if (!amount) {
        outstandingAvailable = false;
        break;
      }
      outstandingPrincipal += Number(balance);
    }
  }

  const counts = loans?.reduce(
    (totals, loan) => {
      if (
        loan.status === "LOAN_STATUS_DISBURSED" ||
        loan.status === "LOAN_STATUS_ACTIVE" ||
        loan.status === "LOAN_STATUS_RESTRUCTURING"
      ) {
        totals.active += 1;
      } else if (
        loan.status === "LOAN_STATUS_PENDING" ||
        loan.status === "LOAN_STATUS_APPROVED" ||
        loan.status === "LOAN_STATUS_MANUAL_REVIEW"
      ) {
        totals.pending += 1;
      } else if (loan.status === "LOAN_STATUS_DELINQUENT") {
        totals.delinquent += 1;
      } else if (
        loan.status === "LOAN_STATUS_CLOSED" ||
        loan.status === "LOAN_STATUS_REJECTED" ||
        loan.status === "LOAN_STATUS_WRITTEN_OFF"
      ) {
        totals.closed += 1;
      }
      return totals;
    },
    {active: 0, pending: 0, delinquent: 0, closed: 0},
  );
  const totalLoans = counts
    ? counts.active + counts.pending + counts.delinquent + counts.closed
    : 0;
  const loanMix =
    counts && totalLoans > 0
      ? [
          {
            name: "Active",
            value: Math.round((counts.active / totalLoans) * 100),
            color: "#9e1c2a",
          },
          {
            name: "Pending",
            value: Math.round((counts.pending / totalLoans) * 100),
            color: "#f1b651",
          },
          {
            name: "Overdue",
            value: Math.round((counts.delinquent / totalLoans) * 100),
            color: "#ec7a7a",
          },
          {
            name: "Closed",
            value: Math.round((counts.closed / totalLoans) * 100),
            color: "#e6e2e2",
          },
        ]
      : null;

  return (
    <MainDashboard
      data={{
        outstandingLoans: outstandingAvailable
          ? `KES ${new Intl.NumberFormat("en-KE", {
              maximumFractionDigits: 0,
            }).format(outstandingPrincipal)}`
          : null,
        activeMembers:
          membersResult.status === "fulfilled" ? membersResult.value : null,
        loanMix,
        pendingApplications: counts?.pending ?? null,
        delinquentPercent:
          totalLoans > 0 && counts
            ? Math.round((counts.delinquent / totalLoans) * 100)
            : null,
      }}
    />
  );
}
