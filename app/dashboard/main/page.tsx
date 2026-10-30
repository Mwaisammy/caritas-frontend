import {connection} from "next/server";
import {Suspense} from "react";
import MainDashboard from "./dashboard-view";
import DashboardLoading from "../loading";
import {goApiPost} from "@/lib/server/go-api";
import {MEMBER_BRANCH_ID} from "@/app/dashboard/members/config";

// DashboardSummary keeps gateway int64 fields as strings until the page formats them.
type DashboardSummary = {
  activeMembers?: string;
  activeLoans?: string;
  pendingLoans?: string;
  delinquentLoans?: string;
  closedLoans?: string;
  outstandingPrincipal?: string;
  shareCapital?: string;
  collectionsThisMonth?: string;
};

// DashboardContent waits for request-time metrics after the page fallback has rendered.
async function DashboardContent() {
  await connection();
  const summary = await goApiPost<DashboardSummary>("/api/v1/dashboard/summary", {
    branchId: MEMBER_BRANCH_ID,
  }).catch(() => null);

  const counts = summary
    ? {
        active: Number(summary.activeLoans ?? 0),
        pending: Number(summary.pendingLoans ?? 0),
        delinquent: Number(summary.delinquentLoans ?? 0),
        closed: Number(summary.closedLoans ?? 0),
      }
    : null;
  const totalLoans = counts
    ? counts.active + counts.pending + counts.delinquent + counts.closed
    : 0;
  const principal = summary?.outstandingPrincipal?.match(/^(\d+)(?:\.(\d+))?$/);
  const roundedPrincipal = principal
    ? BigInt(principal[1]) + (Number(principal[2]?.[0] ?? 0) >= 5 ? BigInt(1) : BigInt(0))
    : null;
  const shareCapital = summary?.shareCapital?.match(/^(\d+)(?:\.(\d+))?$/);
  const roundedShares = shareCapital
    ? BigInt(shareCapital[1]) + (Number(shareCapital[2]?.[0] ?? 0) >= 5 ? BigInt(1) : BigInt(0))
    : null;
  const collections = summary?.collectionsThisMonth?.match(/^(\d+)(?:\.(\d+))?$/);
  const roundedCollections = collections
    ? BigInt(collections[1]) + (Number(collections[2]?.[0] ?? 0) >= 5 ? BigInt(1) : BigInt(0))
    : null;

  return (
    <MainDashboard
      data={{
        outstandingLoans: roundedPrincipal === null
          ? null
          : `KES ${new Intl.NumberFormat("en-KE").format(roundedPrincipal)}`,
        shareCapital: roundedShares === null
          ? null
          : `KES ${new Intl.NumberFormat("en-KE").format(roundedShares)}`,
        collectionsThisMonth: roundedCollections === null
          ? null
          : `KES ${new Intl.NumberFormat("en-KE").format(roundedCollections)}`,
        activeMembers: summary ? Number(summary.activeMembers ?? 0) : null,
        loanMix: counts && totalLoans > 0
          ? [
              {name: "Active", value: Math.round(counts.active / totalLoans * 100), color: "#9e1c2a"},
              {name: "Pending", value: Math.round(counts.pending / totalLoans * 100), color: "#f1b651"},
              {name: "Overdue", value: Math.round(counts.delinquent / totalLoans * 100), color: "#ec7a7a"},
              {name: "Closed", value: Math.round(counts.closed / totalLoans * 100), color: "#e6e2e2"},
            ]
          : null,
        pendingApplications: counts?.pending ?? null,
        delinquentPercent: counts && totalLoans > 0
          ? Math.round(counts.delinquent / totalLoans * 100)
          : null,
      }}
    />
  );
}

// MainPage gives client navigation a fallback below the shared dashboard layout.
export default function MainPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
