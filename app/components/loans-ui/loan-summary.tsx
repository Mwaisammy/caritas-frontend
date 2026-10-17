import type {Loan} from "@/lib/go-api-client";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {formatLoanDate, formatLoanMoney, formatLoanRate, loanMoneyUnits} from "./loan-badges";

// LoanSummary separates debt, payment allocations and member credit; original principal is never presented as the balance.
export function LoanSummary({loan}: {loan: Loan}) {
  const financial = loan.financialSummary;
  const payable = ["LOAN_STATUS_ACTIVE", "LOAN_STATUS_DISBURSED", "LOAN_STATUS_DELINQUENT"].includes(loan.status);
  const settled = financial && loanMoneyUnits(financial.totalOutstanding) === BigInt(0);
  const nextMonth = financial ? new Date(`${financial.asOfPeriod.slice(0, 7)}-01T12:00:00Z`) : null;
  nextMonth?.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const nextMonthLabel = nextMonth?.toLocaleDateString("en-KE", {month: "long", year: "numeric", timeZone: "Africa/Nairobi"});

  return (
    <section className="flex flex-col gap-5" aria-label="Loan balances and interest">
      {financial && loan.disbursedAt ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {label: "Total to settle this month", amount: financial.totalOutstanding, detail: "Unpaid principal + interest + penalties. Credit is shown separately."},
              {label: "Principal still unpaid", amount: financial.principalOutstanding, detail: `Original principal: ${formatLoanMoney(loan.principal)}`},
              {label: "Interest payable now", amount: financial.interestOutstanding, detail: `${formatLoanRate(loan.interestRate)} monthly, on opening unpaid principal.`},
              {label: "Available overpayment credit", amount: financial.availableCredit, detail: "Member funds from this loan. Not automatically applied or refunded."},
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader><CardDescription>{item.label}</CardDescription></CardHeader>
                <CardContent><p className="break-words text-2xl font-semibold tabular-nums">{formatLoanMoney(item.amount)}</p></CardContent>
                <CardFooter><p className="text-xs text-muted-foreground">{item.detail}</p></CardFooter>
              </Card>
            ))}
          </div>
          {payable && settled ? (
            <Alert variant="destructive">
              <AlertTitle>Balances are settled, but the loan is still open</AlertTitle>
              <AlertDescription>Refresh and review the payment ledger and closure audit. Do not collect another payment or force the status closed to resolve this discrepancy.</AlertDescription>
            </Alert>
          ) : loan.status === "LOAN_STATUS_CLOSED" ? (
            <Alert>
              <AlertTitle>Loan closed</AlertTitle>
              <AlertDescription>The repayment workflow closes a settled loan and releases its loan security. Any available overpayment remains the member’s credit.</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>What the member needs to pay</CardTitle>
                <CardDescription>For {new Date(`${financial.asOfPeriod}T12:00:00Z`).toLocaleDateString("en-KE", {month: "long", year: "numeric"})}. Rechecked when repayment posts.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt>Principal outstanding</dt><dd className="text-right tabular-nums">{formatLoanMoney(financial.principalOutstanding)}</dd>
                  <dt>Assessed interest still unpaid</dt><dd className="text-right tabular-nums">{formatLoanMoney(financial.assessedInterestOutstanding)}</dd>
                  <dt>Additional interest on payment this month</dt><dd className="text-right tabular-nums">{formatLoanMoney(financial.unpostedInterest)}</dd>
                  <dt>Unpaid penalties</dt><dd className="text-right tabular-nums">{formatLoanMoney(financial.penaltyOutstanding)}</dd>
                  <dt className="font-semibold">Total to settle</dt><dd className="text-right font-semibold tabular-nums">{formatLoanMoney(financial.totalOutstanding)}</dd>
                </dl>
              </CardContent>
              <CardFooter><p className="text-xs text-muted-foreground">This is the full settlement amount, not the next principal installment. Interest already paid is not charged again for the same month.</p></CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Next month’s interest</CardTitle>
                <CardDescription>{nextMonthLabel} · {formatLoanRate(loan.interestRate)} per month</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-3xl font-semibold tabular-nums">{formatLoanMoney(payable ? financial.nextMonthInterest : "0")}</p>
                <Badge variant="secondary">Estimate if no further principal is paid</Badge>
                <p className="text-sm text-muted-foreground">{formatLoanMoney(financial.principalOutstanding)} unpaid principal × {formatLoanRate(loan.interestRate)} monthly rate. Paying principal before next month reduces this amount. Fully repaid principal earns no further interest.</p>
              </CardContent>
              <CardFooter><p className="text-xs text-muted-foreground">Interest uses the month’s opening unpaid principal. This estimate is separate from interest payable now.</p></CardFooter>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Where the repayments went</CardTitle><CardDescription>All posted repayments for this loan, across every page of history.</CardDescription></CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Total received", financial.received], ["Principal paid", financial.principalPaid],
                  ["Interest paid", financial.interestPaid], ["Penalties paid", financial.penaltyPaid],
                  ["Overpayment credit created", financial.overpayment],
                ].map(([label, amount]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{formatLoanMoney(amount)}</dd></div>)}
              </dl>
            </CardContent>
            <CardFooter><p className="text-xs text-muted-foreground">Each repayment pays penalties, then interest, then principal. Any excess becomes member credit. Credit already used or reserved is detailed below.</p></CardFooter>
          </Card>
        </>
      ) : loan.disbursedAt ? (
        <Alert variant="destructive"><AlertTitle>Financial balances unavailable</AlertTitle><AlertDescription>Current debt and credit could not be confirmed. Do not treat missing figures as zero.</AlertDescription></Alert>
      ) : (
        <Alert><AlertTitle>Loan not yet disbursed</AlertTitle><AlertDescription>No repayment is due before disbursement. Requested principal: {formatLoanMoney(loan.principal)}.</AlertDescription></Alert>
      )}
      {(loanMoneyUnits(loan.interestRate) ?? BigInt(0)) >= BigInt(10_000) ? (
        <Alert variant="destructive">
          <AlertTitle>Review the stored monthly interest rate: {formatLoanRate(loan.interestRate)}</AlertTitle>
          <AlertDescription>This loan’s stored rate is charged as displayed. Earlier percentage entry could store 1% as 100%. Confirm the agreed terms and use an approved, audited correction; historical payments have not been rewritten.</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
        <p>Original principal {formatLoanMoney(loan.principal)} · {formatLoanRate(loan.interestRate)} monthly · {loan.repaymentPeriodMonths} months</p>
        <p>Loan last updated {formatLoanDate(loan.updatedAt, true)}</p>
      </div>
    </section>
  );
}
