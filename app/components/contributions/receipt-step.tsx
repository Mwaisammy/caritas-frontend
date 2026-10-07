"use client";

import { BanknoteIcon, PrinterIcon, UserRoundPlusIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  CashMemberState,
  CashMutationState,
} from "@/app/dashboard/contributions/actions";
import {
  allocationLabel,
  formatDecimalMoney,
  formatMoney,
  type ContributionDraft,
} from "./contribution-utils";

// maskedNationalId limits identity exposure on a receipt that may be left at the printer.
function maskedNationalId(value: string) {
  return value.length <= 4
    ? value
    : `${"•".repeat(value.length - 4)}${value.slice(-4)}`;
}

// ReceiptStep prints the confirmed receipt and only claims balances returned authoritatively.
export function ReceiptStep({
  draft,
  memberState,
  onAnotherMember,
  onCloseTill,
  state,
}: {
  draft: ContributionDraft;
  memberState: Extract<CashMemberState, { ok: true }>;
  onAnotherMember: () => void;
  onCloseTill: () => void;
  state: Extract<CashMutationState, { ok: true }>;
}) {
  const receipt = state.receipt;
  if (!receipt) return null;
  const completed = receipt.status === "completed";
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card className="cash-receipt">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Cash contribution receipt</CardTitle>
              <CardDescription>
                Caritas SACCO · Member contribution
              </CardDescription>
            </div>
            <Badge variant={completed ? "secondary" : "outline"}>
              {receipt.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!completed ? (
            <Alert>
              <AlertTitle>Allocation pending review</AlertTitle>
              <AlertDescription>
                Cash was received, but share and loan balances are not confirmed
                as updated.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Receipt reference</span>
              <br />
              {receipt.internalReceiptReference}
            </p>
            <p>
              <span className="text-muted-foreground">Received</span>
              <br />
              {receipt.receivedAt
                ? new Date(receipt.receivedAt).toLocaleString("en-KE")
                : "Not available"}
            </p>
            <p>
              <span className="text-muted-foreground">Member</span>
              <br />
              {memberState.member.profile?.personal?.fullName ??
                "Unnamed member"}
            </p>
            <p>
              <span className="text-muted-foreground">Member number</span>
              <br />
              {memberState.member.memberNumber}
            </p>
            <p>
              <span className="text-muted-foreground">National ID</span>
              <br />
              {maskedNationalId(memberState.member.nationalId)}
            </p>
            <p>
              <span className="text-muted-foreground">Contribution period</span>
              <br />
              {draft.contributionPeriod}
            </p>
            <p>
              <span className="text-muted-foreground">Session reference</span>
              <br />
              <span className="font-mono text-xs">{receipt.sessionId}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Amount collected</span>
              <br />
              <strong>{formatMoney(receipt.amount)}</strong>
            </p>
          </div>
          <Separator />
          <section className="flex flex-col gap-2">
            <h2 className="font-medium">Allocation</h2>
            {draft.allocations.map((item) => (
              <div
                className="flex items-center justify-between gap-4"
                key={`${item.type}-${item.targetId ?? "general"}`}
              >
                <span>
                  {allocationLabel(item.type)}
                  {item.targetId ? ` · ${item.targetId.slice(0, 8)}` : ""}
                </span>
                <strong>{formatDecimalMoney(item.amount)}</strong>
              </div>
            ))}
          </section>
          <Separator />
          <section className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">
                Updated share balance
              </span>
              <br />
              {completed
                ? formatMoney(state.shareBalance)
                : "Pending allocation"}
            </p>
            {memberState.loans.map(({ loan }) => (
              <p key={loan.id}>
                <span className="text-muted-foreground">
                  Loan updated balance
                </span>
                <br />
                {completed
                  ? "Not available from loan service"
                  : "Pending allocation"}
              </p>
            ))}
          </section>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={() => window.print()}>
          <PrinterIcon data-icon="inline-start" />
          Print receipt
        </Button>
        <Button onClick={onAnotherMember} variant="outline">
          <UserRoundPlusIcon data-icon="inline-start" />
          Another member
        </Button>
        <Button onClick={onCloseTill} variant="ghost">
          <BanknoteIcon data-icon="inline-start" />
          Close till
        </Button>
      </div>
    </div>
  );
}
