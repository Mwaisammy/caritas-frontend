"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BanknoteIcon,
  Loader,
  PrinterIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  loadCashReceiptDetailsAction,
  recoverCashReceiptAction,
  type CashMemberState,
  type CashMutationState,
} from "@/app/dashboard/contributions/actions";
import {
  allocationLabel,
  formatMoney,
  formatReceiptLoanAmount,
} from "./contribution-utils";
import { ContributionPrintReceipt } from "./contribution-print-receipt";

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

  const receipt =
    refreshed?.id === state.receipt?.id ? refreshed : state.receipt;

  useEffect(() => {
    if (!receipt) return;

    let active = true;

    startDetails(async () => {
      const result = await loadCashReceiptDetailsAction(receipt.id).catch(
        () => undefined,
      );

      if (active && result?.ok) {
        setDetails({ message: "", receipt, ...result });
      }
    });

    return () => {
      active = false;
    };
  }, [receipt]);

  if (!receipt) return null;

  const completed = receipt.status === "completed";
  const pending =
    receipt.status === "pending" || receipt.status === "processing";

  const allocations = receipt.allocations ?? [];

  const allocationsCompleted =
    completed &&
    allocations.length > 0 &&
    allocations.every((item) => item.status === "completed");

  const detailsReady = details?.receipt === receipt;

  const needsShareBalance = allocations.some(
    (item) => item.type === "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE",
  );

  const shareBalance =
    detailsReady && completed ? details?.shareBalance : undefined;

  const printDisabledReason = !allocationsCompleted
    ? pending
      ? "Payment is still processing, please wait..."
      : "Please check the payment status."
    : loadingDetails || checking
      ? "Loading receipt..."
      : !detailsReady
        ? "Receipt details unavailable. Try again."
        : needsShareBalance && !shareBalance
          ? "Share balance unavailable. Try again."
          : "";

  const member =
    (details?.receipt?.id === receipt.id ? details.member : undefined) ??
    (memberState?.member.id === receipt.memberId
      ? memberState.member
      : undefined);
  const loanAllocations = allocations.filter(
    (item) => item.type === "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL",
  );
  const contributionRows: {
    label: string;
    value: string;
    highlight?: boolean;
  }[] = allocations
    .filter(
      (item) => item.type !== "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL",
    )
    .map((item) => ({
      key: `${item.type}-${item.targetId ?? "general"}`,
      label: item.displayLabel || allocationLabel(item.type),
      value: formatMoney(item.amount).replace(/^KES /, ""),
    }));
  if (!receipt.loanSnapshotAvailable || !receipt.loans?.length) {
    contributionRows.push(
      ...loanAllocations.map((item) => ({
        key: `${item.type}-${item.targetId ?? "general"}`,
        label: item.displayLabel || allocationLabel(item.type),
        value: formatMoney(item.amount).replace(/^KES /, ""),
      })),
    );
  }
  if (shareBalance) {
    contributionRows.push({
      label: "Current share balance",
      value: formatMoney(shareBalance).replace(/^KES /, ""),
      highlight: true,
    });
  }
  const loanRows = receipt.loanSnapshotAvailable && receipt.loans?.length
    ? (receipt.loans ?? []).flatMap((loan, index) =>
        ([
          ["Opening principal", loan.openingPrincipal],
          ["Interest this month", loan.periodInterest],
          ["Earlier interest owed", loan.earlierInterestDue],
          ["Interest owed", loan.interestDue],
          ["Penalties owed", loan.penaltyDue],
          ["Loan payment", loan.payment],
          ["Principal paid", loan.principalPaid],
          ["Interest paid", loan.interestPaid],
          ["Penalties paid", loan.penaltyPaid],
          ["Overpayment credit", loan.credit],
          ["Interest remaining", loan.interestRemaining],
          ["Principal after payment", loan.principalRemaining],
        ] as const).map(([label, value]) => ({
          key: `${loan.loanId}-${label}`,
          label: `Loan ${index + 1} ${label.toLowerCase()}`,
          value: formatReceiptLoanAmount(value),
        })),
      )
    : receipt.loanSnapshotAvailable
      ? [{ label: "No loan payments were due", value: "—" }]
      : [{ label: "Loan breakdown unavailable", value: "See loan ledger" }];
  if (!contributionRows.length) {
    contributionRows.push({
      label: "No contribution allocations",
      value: "—",
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="font-medium">Cash contribution receipt</p>

        <Badge variant={completed ? "secondary" : "outline"}>
          {receipt.status.replaceAll("_", " ")}
        </Badge>
      </div>

      {!completed && (
        <Alert className="print:hidden">
          <AlertTitle>
            {pending ? "Payment processing" : "Payment needs review"}
          </AlertTitle>

          <AlertDescription>
            {pending
              ? "Your cash was received. We're updating the balances."
              : "Your cash was received, but the balances need checking. Please contact a manager."}
          </AlertDescription>
        </Alert>
      )}

      {printDisabledReason && (
        <div className="flex flex-col gap-2 print:hidden">
          <p role="status" className="flex gap-4 items-center">
            <Loader className="size-4 shrink-0 text-rose-700 motion-safe:animate-spin motion-reduce:animate-none" />

            <span className="text-muted-foreground">{printDisabledReason}</span>
          </p>

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

                  if (result?.ok && result.receipt) {
                    setRefreshed(result.receipt);
                  } else {
                    setStatusError(
                      result?.message ?? "Couldn't check payment status.",
                    );
                  }
                } catch {
                  setStatusError("Couldn't check payment status. Try again.");
                }
              })
            }
          >
            {checking
              ? "Checking..."
              : allocationsCompleted
                ? "Retry receipt details"
                : "Check payment status"}
          </Button>

          {statusError && <p role="alert">{statusError}</p>}
        </div>
      )}

      <ContributionPrintReceipt
        receiptNumber={receipt.internalReceiptReference}
        memberNumber={member?.memberNumber ?? "Not available"}
        memberName={member?.profile?.personal?.fullName ?? "Unnamed member"}
        period={new Date(
          receipt.contributionPeriod.slice(0, 7) + "-01T00:00:00+03:00",
        ).toLocaleDateString("en-KE", {
          month: "long",
          year: "numeric",
          timeZone: "Africa/Nairobi",
        })}
        receivedOn={
          receipt.receivedAt
            ? new Date(receipt.receivedAt).toLocaleString("en-KE", {
                timeZone: "Africa/Nairobi",
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Not available"
        }
        paymentMethod="Cash"
        paymentDetailLabel="Received by"
        paymentDetail={state.session?.cashierName ?? "________________"}
        amount={receipt.amount}
        contributionRows={contributionRows}
        loanRows={loanRows}
        notice={
          !completed
            ? "Cash received · " +
              receipt.status.replaceAll("_", " ") +
              " · Balances are not yet confirmed."
            : undefined
        }
      />
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
