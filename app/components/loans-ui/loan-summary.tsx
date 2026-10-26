import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Loan} from "@/lib/go-api-client";
import {
  formatLoanDate,
  formatLoanMoney,
  formatLoanRate,
  loanMoneyUnits,
} from "./loan-badges";

// Keeps settlement, current interest and future estimates distinct in the loan summary.
export function LoanSummary({loan}: {loan: Loan}) {
  const financial = loan.financialSummary;
  const payable = [
    "LOAN_STATUS_ACTIVE",
    "LOAN_STATUS_DISBURSED",
    "LOAN_STATUS_DELINQUENT",
  ].includes(loan.status);
  const settled =
    financial && loanMoneyUnits(financial.totalOutstanding) === BigInt(0);
  const nextMonth = financial
    ? new Date(`${financial.asOfPeriod.slice(0, 7)}-01T12:00:00Z`)
    : null;
  nextMonth?.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const nextMonthLabel = nextMonth?.toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });

  return (
    <section
      className="flex flex-col gap-5"
      aria-label="Loan balances and interest"
    >
      {financial && loan.disbursedAt ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Settlement balance",
                amount: financial.totalOutstanding,
              },
              {
                label: "Principal outstanding",
                amount: financial.principalOutstanding,
              },
              {
                label: "Interest due",
                amount: financial.interestOutstanding,
              },
              {
                label: "Available credit",
                amount: financial.availableCredit,
              },
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardDescription>{item.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="wrap-break-words text-2xl font-semibold tabular-nums">
                    {formatLoanMoney(item.amount)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {payable && settled ? (
            <Alert variant="destructive">
              <AlertTitle>
                Loan still open
              </AlertTitle>
              <AlertDescription>
                Balance is settled. Review closure before collecting another payment.
              </AlertDescription>
            </Alert>
          ) : loan.status === "LOAN_STATUS_CLOSED" ? (
            <Alert>
              <AlertTitle>Loan closed</AlertTitle>
              <AlertDescription>
                Any remaining credit belongs to the member.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Settlement breakdown</CardTitle>
                <CardDescription>
                  {new Date(
                    `${financial.asOfPeriod}T12:00:00Z`,
                  ).toLocaleDateString("en-KE", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt>Principal</dt>
                  <dd className="text-right tabular-nums">
                    {formatLoanMoney(financial.principalOutstanding)}
                  </dd>
                  <dt>Assessed interest</dt>
                  <dd className="text-right tabular-nums">
                    {formatLoanMoney(financial.assessedInterestOutstanding)}
                  </dd>
                  <dt>Unposted interest</dt>
                  <dd className="text-right tabular-nums">
                    {formatLoanMoney(financial.unpostedInterest)}
                  </dd>
                  <dt>Penalties</dt>
                  <dd className="text-right tabular-nums">
                    {formatLoanMoney(financial.penaltyOutstanding)}
                  </dd>
                  <dt className="font-semibold">Total settlement</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {formatLoanMoney(financial.totalOutstanding)}
                  </dd>
                </dl>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Full settlement, not the next installment.
                </p>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Next month’s interest</CardTitle>
                <CardDescription>
                  {nextMonthLabel} · {formatLoanRate(loan.interestRate)} per
                  month
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-3xl font-semibold tabular-nums">
                  {formatLoanMoney(payable ? financial.nextMonthInterest : "0")}
                </p>
                <Badge variant="outline">Estimate if principal stays unchanged</Badge>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Repayment totals</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Total received", financial.received],
                  ["Principal paid", financial.principalPaid],
                  ["Interest paid", financial.interestPaid],
                  ["Penalties paid", financial.penaltyPaid],
                  ["Credit created", financial.overpayment],
                ].map(([label, amount]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">
                      {formatLoanMoney(amount)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </>
      ) : loan.disbursedAt ? (
        <Alert variant="destructive">
          <AlertTitle>Balances unavailable</AlertTitle>
          <AlertDescription>
            Current balances could not be confirmed. Missing figures are not zero.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>Loan not yet disbursed</AlertTitle>
          <AlertDescription>
            No repayment due. Requested principal:{" "}
            {formatLoanMoney(loan.principal)}.
          </AlertDescription>
        </Alert>
      )}
      {(loanMoneyUnits(loan.interestRate) ?? BigInt(0)) >= BigInt(10_000) ? (
        <Alert variant="destructive">
          <AlertTitle>
            Review monthly interest rate:{" "}
            {formatLoanRate(loan.interestRate)}
          </AlertTitle>
          <AlertDescription>
            Confirm the agreed rate. Any correction requires approval and an audit record.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
        <p>
          Original principal {formatLoanMoney(loan.principal)} ·{" "}
          {formatLoanRate(loan.interestRate)} monthly ·{" "}
          {loan.repaymentPeriodMonths} months
        </p>
        <p>Updated {formatLoanDate(loan.updatedAt, true)}</p>
      </div>
    </section>
  );
}
