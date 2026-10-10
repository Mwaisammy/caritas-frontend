"use client";
import { ChargeAssessment } from "./charge-assessment";
import { useState, useEffect, useTransition } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  loadCashObligationsAction,
  type CashMemberState,
} from "@/app/dashboard/contributions/actions";
import {
  currentPeriod,
  draftAllocations,
  formatDecimalMoney,
  formatMoney,
  moneyDecimal,
  minorUnits,
  formatMinorUnits,
  allocationLabel,
  type AllocationAmounts,
  type ContributionDraft,
} from "./contribution-utils";
// MoneyField keeps amount constraints and labels consistent across contribution allocations.
function MoneyField({
  id,
  label,
  readOnly,
  value,
  onChange,
}: {
  id: string;
  label: string;
  readOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const invalid = value !== "" && !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value);
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={invalid}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder="KES 00.00"
        readOnly={readOnly}
        value={value}
      />
      {invalid ? (
        <FieldError>
          Enter a valid KES amount with up to two decimal places.
        </FieldError>
      ) : null}
    </Field>
  );
}
// ContributionEntryStep shows the member's position and collects one allocation draft.
export function ContributionEntryStep({
  amounts,
  initialPeriod,
  memberState,
  onBack,
  onReview,
  setAmounts,
}: {
  amounts: AllocationAmounts;
  initialPeriod?: string;
  memberState: Extract<CashMemberState, { ok: true }>;
  onBack: () => void;
  onReview: (draft: ContributionDraft) => void;
  setAmounts: (amounts: AllocationAmounts) => void;
}) {
  const [period, setPeriod] = useState(initialPeriod ?? currentPeriod());
  const [obligations, setObligations] = useState<Awaited<
    ReturnType<typeof loadCashObligationsAction>
  > | null>(null);
  const [loading, startLoading] = useTransition();
  const [loadedPeriod, setLoadedPeriod] = useState("");
  const [entryError, setEntryError] = useState("");
  useEffect(() => {
    let active = true;
    startLoading(async () => {
      const result = await loadCashObligationsAction(
        memberState.member.id,
        period,
      );
      if (active) {
        setObligations(result);
        setLoadedPeriod(period);
      }
    });
    return () => {
      active = false;
    };
  }, [memberState.member.id, period]);
  const ready = obligations?.ok && loadedPeriod === period && !loading;
  const charges = obligations?.ok ? obligations.charges : [];
  const fees = obligations?.ok
    ? obligations.fees.map((fee) => ({
        type: fee.type,
        amount: moneyDecimal(fee.amount),
      }))
    : [];
  const allocations = draftAllocations(
    amounts,
    memberState.shareAccount?.id,
    charges,
    fees,
  );
  const total = allocations.reduce(
    (sum, row) => sum + minorUnits(row.amount),
    0,
  );
  const difference = minorUnits(amounts.cash) - total;
  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>
          {memberState.member.profile?.personal?.fullName ?? "Unnamed member"}
        </CardTitle>
        <CardDescription>
          Member {memberState.member.memberNumber} · Review the financial
          position before entering cash.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {memberState.warnings.map((warning) => (
          <Alert key={warning}>
            <AlertTitle>Financial information unavailable</AlertTitle>
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        ))}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Share account</h2>
            <Badge variant={memberState.shareAccount ? "secondary" : "outline"}>
              {memberState.sharesUnavailable
                ? "Unavailable"
                : memberState.shareAccount
                  ? "Active"
                  : "No active account"}
            </Badge>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">
              Current share balance:
            </span>{" "}
            {formatMoney(memberState.shareBalance)}
          </p>
        </section>
        <Separator />
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">Loan position</h2>
          {memberState.loans.length === 0 ? (
            <Alert>
              <AlertTitle>
                {memberState.loansUnavailable
                  ? "Loan information unavailable"
                  : "No active loan"}
              </AlertTitle>
              <AlertDescription>
                {memberState.loansUnavailable
                  ? "Reload the member position before selecting a loan payment."
                  : "This member has no payable loan."}
              </AlertDescription>
            </Alert>
          ) : (
            memberState.loans.map(({ loan, schedule, scheduleError }) => {
              const installment = schedule.find((item) =>
                item.dueDate.startsWith(period),
              );
              return (
                <Card key={loan.id} size="sm">
                  <CardHeader>
                    {/* <CardTitle>Loan {loan.id.slice(0, 8)}</CardTitle> */}
                    <CardDescription>
                      <Badge variant="outline">
                        {loan.status
                          .replace("LOAN_STATUS_", "")
                          .replaceAll("_", " ")}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <p>
                      <span className="text-muted-foreground">
                        Current balance:
                      </span>
                      <br />
                      Current balance unavailable
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Scheduled this month:
                      </span>
                      <br />
                      {schedule.length === 0 && scheduleError
                        ? "Schedule unavailable"
                        : installment
                          ? formatDecimalMoney(installment.amountDue)
                          : "No installment scheduled"}
                    </p>
                    {installment ? (
                      <p>
                        <span className="text-muted-foreground">Due date:</span>
                        <br />
                        {new Date(installment.dueDate).toLocaleDateString(
                          "en-KE",
                        )}
                      </p>
                    ) : null}
                    {installment ? (
                      <p>
                        <span className="text-muted-foreground">
                          Installment status:
                        </span>
                        <br />
                        <Badge variant="secondary">
                          {installment.status
                            .replace("REPAYMENT_STATUS_", "")
                            .replaceAll("_", " ")}
                        </Badge>
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
        <Separator />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const values = [
              amounts.cash,
              amounts.shares,
              ...Object.values(amounts.loans),
              ...Object.values(amounts.charges),
            ];
            if (
              values.some(
                (value) =>
                  value !== "" && !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value),
              )
            ) {
              setEntryError("Correct the invalid amounts before reviewing.");
              return;
            }
            if (!ready || minorUnits(amounts.cash) <= 0 || difference !== 0) {
              setEntryError(
                "Allocate the exact cash received, including unpaid monthly fees.",
              );
              return;
            }
            if (
              charges.some(
                (charge) =>
                  minorUnits(amounts.charges[charge.id] ?? "") >
                  minorUnits(moneyDecimal(charge.outstanding)),
              )
            ) {
              setEntryError("A charge payment exceeds its outstanding amount.");
              return;
            }
            onReview({
              contributionPeriod: period,
              allocations,
              amount: amounts.cash,
            });
          }}
        >
          <FieldGroup>
            <MoneyField
              id="cash"
              label="Physical cash received (KES)"
              value={amounts.cash}
              onChange={(cash) => setAmounts({ ...amounts, cash })}
            />
            <Field>
              <FieldLabel htmlFor="contributionPeriod">
                Contribution period
              </FieldLabel>
              <Input
                id="contributionPeriod"
                onChange={(event) => setPeriod(event.target.value)}
                required
                max={currentPeriod()}
                type="month"
                value={period}
              />
            </Field>
            <FieldSet>
              <FieldLegend>Cash allocation</FieldLegend>
              <FieldDescription>
                Monthly fees are calculated for this member and period. Loans
                determines the actual interest, principal, and credit split.
              </FieldDescription>
              {loading || loadedPeriod !== period ? (
                <p role="status">Loading obligations...</p>
              ) : null}
              {obligations?.ok === false ? (
                <Alert variant="destructive">
                  <AlertTitle>Obligations unavailable</AlertTitle>
                  <AlertDescription>{obligations.message}</AlertDescription>
                </Alert>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() =>
                  startLoading(async () => {
                    setObligations(
                      await loadCashObligationsAction(
                        memberState.member.id,
                        period,
                      ),
                    );
                    setLoadedPeriod(period);
                  })
                }
              >
                Reload obligations
              </Button>
              {ready ? (
                <p>
                  Unpaid monthly fees:{" "}
                  {fees.length
                    ? fees
                        .map(
                          (fee) =>
                            `${allocationLabel(fee.type)} ${formatDecimalMoney(fee.amount)}`,
                        )
                        .join(" · ")
                    : "None"}
                </p>
              ) : null}
              <FieldGroup className="grid sm:grid-cols-2">
                {memberState.shareAccount ? (
                  <MoneyField
                    id="shares"
                    label="Share purchase (KES)"
                    onChange={(shares) => setAmounts({ ...amounts, shares })}
                    value={amounts.shares}
                  />
                ) : null}
                {charges
                  .filter(
                    (charge) =>
                      minorUnits(moneyDecimal(charge.outstanding)) > 0,
                  )
                  .map((charge) => {
                    const value = amounts.charges[charge.id] ?? "";
                    const invalid =
                      value !== "" &&
                      (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value) ||
                        minorUnits(value) >
                          minorUnits(moneyDecimal(charge.outstanding)));
                    return (
                      <Field key={charge.id} data-invalid={invalid}>
                        <FieldLabel htmlFor={`charge-${charge.id}`}>
                          {charge.category === "penalty"
                            ? "Non-loan penalty"
                            : charge.category.replaceAll("_", " ")}{" "}
                          - {charge.reason}
                        </FieldLabel>
                        <FieldDescription>
                          Outstanding: {formatMoney(charge.outstanding)}
                        </FieldDescription>
                        <Input
                          id={`charge-${charge.id}`}
                          inputMode="decimal"
                          value={value}
                          aria-invalid={invalid}
                          onChange={(event) =>
                            setAmounts({
                              ...amounts,
                              charges: {
                                ...amounts.charges,
                                [charge.id]: event.target.value,
                              },
                            })
                          }
                        />
                        {invalid ? (
                          <FieldError>
                            Enter a valid KES amount no greater than the
                            outstanding charge.
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  })}
                {memberState.loans.map(({ loan }) => (
                  <MoneyField
                    id={`loan-${loan.id}`}
                    key={loan.id}
                    label={`Loan  payment (KES)`}
                    onChange={(amount) =>
                      setAmounts({
                        ...amounts,
                        loans: { ...amounts.loans, [loan.id]: amount },
                      })
                    }
                    value={amounts.loans[loan.id] ?? ""}
                  />
                ))}
              </FieldGroup>
            </FieldSet>
            <p>
              Allocated: {formatMinorUnits(total)} ·{" "}
              {difference < 0 ? "Overallocated" : "Unallocated"}:{" "}
              {formatMinorUnits(Math.abs(difference))}
            </p>
            {entryError ? (
              <Alert variant="destructive">
                <AlertDescription>{entryError}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              disabled={
                !ready || minorUnits(amounts.cash) <= 0 || difference !== 0
              }
              type="submit"
            >
              Review contribution
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </FieldGroup>
        </form>
        <ChargeAssessment
          memberId={memberState.member.id}
          onCreated={() =>
            startLoading(async () => {
              setObligations(
                await loadCashObligationsAction(memberState.member.id, period),
              );
              setLoadedPeriod(period);
            })
          }
        />
      </CardContent>
      <CardFooter>
        <Button onClick={onBack} type="button" variant="ghost">
          <ArrowLeftIcon data-icon="inline-start" />
          Choose another member
        </Button>
      </CardFooter>
    </Card>
  );
}
