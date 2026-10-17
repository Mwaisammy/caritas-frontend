import Link from "next/link";
import type {Loan} from "@/lib/go-api-client";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {formatLoanMoney, formatLoanRate} from "@/app/components/loans-ui/loan-badges";
import {StatusBadge} from "./status-badge";

// RecentApplications exposes remaining principal and available loan credit before an officer opens the full breakdown.
export function RecentApplications({loans}: {loans: Loan[]}) {
  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle>Loan applications and balances</CardTitle>
        <CardDescription>Principal outstanding excludes interest and penalties. Open a loan for the full settlement amount and payment allocations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Member</th><th className="px-4 py-3">Member no.</th>
                <th className="px-4 py-3">Original principal</th><th className="px-4 py-3">Principal outstanding</th>
                <th className="px-4 py-3">Available credit</th><th className="px-4 py-3">Monthly interest</th>
                <th className="px-4 py-3">Term</th><th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr className="relative border-t hover:bg-muted/50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring" key={loan.id}>
                  <td className="px-4 py-3 font-medium"><Link className="after:absolute after:inset-0 focus:outline-none" href={`/dashboard/loans/${loan.id}`}>{loan.memberName || "Unknown member"}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{loan.memberNumber || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{formatLoanMoney(loan.principal)}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{["LOAN_STATUS_PENDING", "LOAN_STATUS_APPROVED", "LOAN_STATUS_REJECTED"].includes(loan.status) ? "Not disbursed" : loan.outstandingPrincipal === undefined ? "Unavailable" : formatLoanMoney(loan.outstandingPrincipal)}</td>
                  <td className="px-4 py-3 tabular-nums">{loan.availableCredit === undefined ? "Unavailable" : formatLoanMoney(loan.availableCredit)}</td>
                  <td className="px-4 py-3">{formatLoanRate(loan.interestRate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{loan.repaymentPeriodMonths} months</td>
                  <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loans.length ? <p className="py-8 text-center text-sm text-muted-foreground">No loan applications found.</p> : null}
      </CardContent>
    </Card>
  );
}
