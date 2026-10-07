"use client";

import { useState } from "react";
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
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { CashMemberState } from "@/app/dashboard/contributions/actions";
import {
  currentPeriod,
  draftAllocations,
  formatDecimalMoney,
  formatMoney,
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
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder="KES 00.00"
        readOnly={readOnly}
        value={value}
      />
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
  const allocations = draftAllocations(amounts, memberState.shareAccount?.id);
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
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Share account</h2>
            <Badge variant={memberState.shareAccount ? "secondary" : "outline"}>
              {memberState.shareAccount ? "Active" : "No active account"}
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
              <AlertTitle>No active loan</AlertTitle>
              <AlertDescription>
                This member has no payable loan.
              </AlertDescription>
            </Alert>
          ) : (
            memberState.loans.map(({ loan, schedule }) => {
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
                      Not available from loan service
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Scheduled this month:
                      </span>
                      <br />
                      {installment
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
            onReview({ contributionPeriod: period, allocations });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contributionPeriod">
                Contribution period
              </FieldLabel>
              <Input
                id="contributionPeriod"
                onChange={(event) => setPeriod(event.target.value)}
                required
                type="month"
                value={period}
              />
            </Field>
            <FieldSet>
              <FieldLegend>Cash allocation</FieldLegend>
              <FieldDescription>
                COM and LGOM use the current KES 30 monthly defaults.
              </FieldDescription>
              <FieldGroup className="grid sm:grid-cols-2">
                <MoneyField
                  id="com"
                  label="COM (KES)"
                  onChange={(com) => setAmounts({ ...amounts, com })}
                  value={amounts.com}
                />
                <MoneyField
                  id="lgom"
                  label="LGOM (KES)"
                  onChange={(lgom) => setAmounts({ ...amounts, lgom })}
                  value={amounts.lgom}
                />
                {memberState.shareAccount ? (
                  <MoneyField
                    id="shares"
                    label="Share purchase (KES)"
                    onChange={(shares) => setAmounts({ ...amounts, shares })}
                    value={amounts.shares}
                  />
                ) : null}
                <MoneyField
                  id="otherCharge"
                  label="Other approved charge (KES)"
                  onChange={(otherCharge) =>
                    setAmounts({ ...amounts, otherCharge })
                  }
                  value={amounts.otherCharge}
                />
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
            <Button disabled={allocations.length === 0} type="submit">
              Review contribution
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </FieldGroup>
        </form>
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
