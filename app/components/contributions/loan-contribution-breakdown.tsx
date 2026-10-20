import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContributionLoanSummary } from "@/lib/go-api-client";
import type { ContributionAllocationDraft } from "./contribution-utils";

// Loan amounts retain all four ledger decimal places during allocation; cents would hide small unpaid debts.
function loanUnits(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(10_000) + BigInt(fraction.padEnd(4, "0").slice(0, 4));
}

// Formatting scaled integers preserves fractional-cent debt without floating-point rounding.
function formatLoanUnits(value: bigint) {
  const fraction = (value % BigInt(10_000)).toString().padStart(4, "0");
  return `KES ${(value / BigInt(10_000)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.slice(2) === "00" ? fraction.slice(0, 2) : fraction}`;
}

// One breakdown keeps cash and M-Pesa review, receipt and print views consistent.
// Review is an estimate; posted values come only from the stored receipt snapshot.
export function LoanContributionBreakdown({
  loans,
  allocations = [],
  posted = false,
  pending = false,
  snapshotAvailable = false,
}: {
  loans?: ContributionLoanSummary[];
  allocations?: ContributionAllocationDraft[];
  posted?: boolean;
  pending?: boolean;
  snapshotAvailable?: boolean;
}) {
  if (pending) return (
    <Alert>
      <AlertTitle>Loan breakdown pending</AlertTitle>
      <AlertDescription>Interest and principal payments are confirmed only after all allocations complete.</AlertDescription>
    </Alert>
  );
  if ((posted && !snapshotAvailable) || (!posted && !loans)) return (
    <Alert>
      <AlertTitle>Loan breakdown unavailable</AlertTitle>
      <AlertDescription>
        {posted
          ? "Loan figures were not saved with this receipt. Refer to the loan ledger for its payment history."
          : "Reload the member’s obligations to show the interest owed before recording payment."}
      </AlertDescription>
    </Alert>
  );
  if (!loans?.length) return (
    <p className="text-sm text-muted-foreground">
      No payable loans were found for this member{posted ? " when this receipt was posted" : ""}.
    </p>
  );
  return <section className="flex flex-col gap-3" aria-label="Loan interest and payment breakdown">
    <h2 className="font-medium">{posted ? "Loan payment breakdown" : "Loan interest and proposed payment"}</h2>
    <p className="text-sm text-muted-foreground">
      {posted
        ? "Figures saved when this receipt was posted. Later payments do not change this breakdown."
        : "Interest is calculated by Loans even when no loan payment is entered. The proposed split may change if another payment posts first."}
      {" "}Payments settle penalties, then interest, then principal. Excess becomes credit.
    </p>
    {loans.map((loan) => {
      if (!loan.payable) return (
        <Alert key={loan.loanId}>
          <AlertTitle>Loan {loan.loanId.slice(-8)}</AlertTitle>
          <AlertDescription>
            No loan payment can be posted for {loan.period.slice(0, 7)} because it precedes disbursement or later loan activity.
            Choose an eligible period to see the payable interest.
          </AlertDescription>
        </Alert>
      );
      const interestDue = loanUnits(loan.interestDue);
      const principalDue = loanUnits(loan.principalDue);
      const penaltyDue = loanUnits(loan.penaltyDue);
      const payment = loanUnits(posted ? loan.payment : allocations.find(
        (item) => item.type === "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL" && item.targetId === loan.loanId,
      )?.amount || "0");
      let available = payment;
      const penalty = posted ? loanUnits(loan.penaltyPaid) : available < penaltyDue ? available : penaltyDue;
      available -= penalty;
      const interest = posted ? loanUnits(loan.interestPaid) : available < interestDue ? available : interestDue;
      available -= interest;
      const principal = posted ? loanUnits(loan.principalPaid) : available < principalDue ? available : principalDue;
      const credit = posted ? loanUnits(loan.credit) : available - principal;
      const remaining = posted ? loanUnits(loan.interestRemaining) : interestDue - interest;
      const rows: [string, bigint][] = [
        ["Opening principal for the month", loanUnits(loan.openingPrincipal)],
        ["Interest for this month", loanUnits(loan.periodInterest)],
        ["Unpaid earlier interest", loanUnits(loan.earlierInterestDue)],
        ["Total interest owed before this payment", interestDue],
        ["Loan penalties owed", penaltyDue],
        [posted ? "Loan payment received" : "Proposed loan payment", payment],
        ["Applied to penalties", penalty],
        ["Applied to interest", interest],
        ["Applied to principal", principal],
        ["Overpayment credit created", credit],
        ["Interest remaining unpaid", remaining],
        ["Remaining principal", posted ? loanUnits(loan.principalRemaining) : principalDue - principal],
      ];
      const [rateWhole, rateFraction = ""] = loan.interestRate.split(".");
      const percentageWhole = BigInt(rateWhole) * BigInt(100) + BigInt(rateFraction.padEnd(2, "0").slice(0, 2));
      const percentageFraction = rateFraction.slice(2).replace(/0+$/, "");
      const rate = `${percentageWhole}${percentageFraction ? `.${percentageFraction}` : ""}`;
      return <Card key={loan.loanId} size="sm">
        <CardHeader>
          <CardTitle>Loan {loan.loanId.slice(-8)} · {loan.period.slice(0, 7)}</CardTitle>
          <CardDescription>
            Monthly interest: opening principal × {rate}%. Interest is rounded to four decimal places.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="flex flex-col gap-2 text-sm">
            {rows.map(([label, amount]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt>{label}</dt>
                <dd className="shrink-0 font-medium tabular-nums">{formatLoanUnits(amount)}</dd>
              </div>
            ))}
          </dl>
          {remaining > BigInt(0) ? (
            <p className="text-sm font-medium">
              {payment === BigInt(0) ? "No loan payment was allocated. " : ""}
              {formatLoanUnits(remaining)} interest remains payable. It is not deducted from shares.
            </p>
          ) : null}
        </CardContent>
      </Card>;
    })}
  </section>;
}
