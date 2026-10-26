"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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
import {
  loadCashReceiptDetailsAction,
  recoverCashReceiptAction,
  type CashMemberState,
  type CashMutationState,
} from "@/app/dashboard/contributions/actions";
import { allocationLabel, formatMoney } from "./contribution-utils";
import { LoanContributionBreakdown } from "./loan-contribution-breakdown";
// maskedNationalId limits identity exposure on a receipt that may be left at the printer.
function maskedNationalId(value: string) {
  return value.length <= 4
    ? value
    : `${"•".repeat(value.length - 4)}${value.slice(-4)}`;
}
// ReceiptStep prints the confirmed receipt and only claims balances returned authoritatively.
export function ReceiptStep({
  memberState,
  onAnotherMember,
  onCloseTill,
  state,
}: {
  memberState?: Extract<CashMemberState, { ok: true }>;
  onAnotherMember: () => void;
  onCloseTill: () => void;
  state: Extract<CashMutationState, { ok: true }>;
}) {
  const [refreshed, setRefreshed] = useState(state.receipt);
  const [details, setDetails] = useState<Extract<
    CashMutationState,
    { ok: true }
  > | null>(null);
  const [statusError, setStatusError] = useState("");
  const [loadingDetails, startDetails] = useTransition();
  const [checking, startChecking] = useTransition();
  const receipt = refreshed?.id === state.receipt?.id ? refreshed : state.receipt;
  useEffect(() => {
    if (!receipt) return;
    let active = true;
    startDetails(async () => {
      const result = await loadCashReceiptDetailsAction(receipt.id).catch(
        () => undefined,
      );
      if (active && result?.ok) setDetails({ message: "", receipt, ...result });
    });
    return () => {
      active = false;
    };
  }, [receipt]);
  if (!receipt) return null;
  const completed = receipt.status === "completed";
  const pending = receipt.status === "pending" || receipt.status === "processing";
  const allocations = receipt.allocations ?? [];
  const allocationsCompleted =
    completed && allocations.length > 0 &&
    allocations.every((item) => item.status === "completed");
  const detailsReady = details?.receipt === receipt;
  const needsShareBalance = allocations.some(
    (item) => item.type === "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE",
  );
  const shareBalance = detailsReady && completed ? details?.shareBalance : undefined;
  const printDisabledReason = !allocationsCompleted
    ? pending ? "Allocations are still processing." : "Allocations require review."
    : loadingDetails || checking
      ? "Loading receipt details and share balance..."
      : !detailsReady
        ? "Receipt details unavailable. Retry before printing."
        : needsShareBalance && !shareBalance
          ? "Share balance unavailable. Retry before printing."
          : "";
  const member =
    (details?.receipt?.id === receipt.id ? details.member : undefined) ??
    (memberState?.member.id === receipt.memberId
      ? memberState.member
      : undefined);
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
              <AlertTitle>
                {pending ? "Allocations pending" : "Allocation requires review"}
              </AlertTitle>
              <AlertDescription>
                Cash was received, but share and loan balances are not confirmed
                as updated.
                {pending
                  ? " Processing will retry automatically. Check the status to see the result."
                  : " Ask a manager to review this receipt."}
              </AlertDescription>
            </Alert>
          ) : null}
          {printDisabledReason ? (
            <div className="flex flex-col gap-2 print:hidden">
              <p role="status">{printDisabledReason}</p>
              <Button
                variant="outline"
                disabled={checking || loadingDetails}
                onClick={() =>
                  startChecking(async () => {
                    setStatusError("");
                    try {
                      const result = await recoverCashReceiptAction({
                        receiptId: receipt.id,
                      });
                      if (result?.ok && result.receipt)
                        setRefreshed(result.receipt);
                      else
                        setStatusError(
                          result?.message ?? "Unable to check receipt status.",
                        );
                    } catch {
                      setStatusError("Unable to check receipt status. Try again.");
                    }
                  })
                }
              >
                {checking
                  ? "Checking..."
                  : allocationsCompleted
                    ? "Retry receipt details"
                    : "Check allocation status"}
              </Button>
              {statusError ? <p role="alert">{statusError}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Receipt reference</span>
              <br />
              {receipt.internalReceiptReference}
            </p>
            <p>
              <span className="text-muted-foreground">
                Receipt ID for retrieval
              </span>
              <br />
              <span className="font-mono text-xs">{receipt.id}</span>
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
              {member?.profile?.personal?.fullName ?? "Unnamed member"}
            </p>
            <p>
              <span className="text-muted-foreground">Member number</span>
              <br />
              {member?.memberNumber ?? receipt.memberId}
            </p>
            <p>
              <span className="text-muted-foreground">National ID</span>
              <br />
              {member ? maskedNationalId(member.nationalId) : "Not loaded"}
            </p>
            <p>
              <span className="text-muted-foreground">Contribution period</span>
              <br />
              {receipt.contributionPeriod.slice(0, 7)}
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
            <h2 className="font-medium">{completed ? "Payment breakdown" : "Recorded allocation plan"}</h2>
            <p className="text-sm text-muted-foreground">Loan payment totals include the interest, penalties and principal shown in the loan breakdown below.</p>
            {(receipt.allocations ?? []).map((item) => {
              const [label, ...reason] = (item.displayLabel || allocationLabel(item.type)).split(" · ");
              return (
              <div
                className="flex items-center justify-between gap-4"
                key={`${item.type}-${item.targetId ?? "general"}`}
              >
                <span className="min-w-0">
                  {label}
                  {item.type === "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL" && item.targetId ? (
                    <Link className="mt-1 block text-xs underline" href={`/dashboard/loans/${item.targetId}`} target="_blank" rel="noreferrer">
                      {completed ? "View remaining balance, interest and payment split" : "View loan — repayment is not yet confirmed posted"}
                    </Link>
                  ) : null}
                  {reason.length ? (
                    <mark className="mt-1 block max-w-sm rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground wrap-anywhere">
                      {reason.join(" · ")}
                    </mark>
                  ) : null}
                  {item.targetId && !item.displayLabel ? (
                    <span className="block break-all text-xs text-muted-foreground">
                      {item.type === "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL" ? "Loan reference" : "Reference"}: {item.targetId}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0">
                  {formatMoney(item.amount)}
                  {!completed ? ` · ${item.status.replaceAll("_", " ")}` : ""}
                </span>
              </div>
              );
            })}
            <div className="flex justify-between gap-4 font-semibold">
              <span>Total received</span>
              <span>{formatMoney(receipt.amount)}</span>
            </div>
          </section>
          <LoanContributionBreakdown posted pending={!completed} loans={receipt.loans} snapshotAvailable={receipt.loanSnapshotAvailable} />
          <Separator />
          <section className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">
                Current share balance
              </span>
              <br />
              {!completed
                ? "Pending allocation"
                : loadingDetails
                  ? "Loading balance..."
                  : needsShareBalance
                    ? formatMoney(shareBalance)
                    : "No share purchase in this receipt"}
            </p>
          </section>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button
          disabled={Boolean(printDisabledReason)}
          onClick={() => {
            if (!printDisabledReason) window.print();
          }}
        >
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
