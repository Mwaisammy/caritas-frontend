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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  loadCashReceiptDetailsAction,
  recoverCashReceiptAction,
  type CashMemberState,
  type CashMutationState,
} from "@/app/dashboard/contributions/actions";
import { allocationLabel, formatMoney } from "./contribution-utils";

function amountWords(value: bigint): string {
  const small = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  if (value < BigInt(20)) return small[Number(value)];

  if (value < BigInt(100)) {
    return (
      [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ][Number(value / BigInt(10))] +
      (value % BigInt(10) ? ` ${amountWords(value % BigInt(10))}` : "")
    );
  }

  for (const [scale, label] of [
    [BigInt("1000000000000"), "Trillion"],
    [BigInt(1_000_000_000), "Billion"],
    [BigInt(1_000_000), "Million"],
    [BigInt(1_000), "Thousand"],
    [BigInt(100), "Hundred"],
  ] as const) {
    if (value >= scale) {
      return `${amountWords(value / scale)} ${label}${
        value % scale ? ` ${amountWords(value % scale)}` : ""
      }`;
    }
  }

  return "";
}

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

      <article className="cash-receipt" aria-label="Cash contribution receipt">
        <header className="receipt-heading">
          <h1>Our Lady of Consolata Sagana Kabiruini Parish</h1>
          <p>Caritas SACCO · Cash contribution receipt</p>
        </header>

        <Separator />

        <dl className="receipt-member">
          <div>
            <dt>Receipt No.</dt>
            <dd>{receipt.internalReceiptReference}</dd>
          </div>

          <div>
            <dt>Member No.</dt>
            <dd>{member?.memberNumber ?? "Not available"}</dd>
          </div>

          <div>
            <dt>Name</dt>
            <dd>{member?.profile?.personal?.fullName ?? "Unnamed member"}</dd>
          </div>

          <div>
            <dt>For month</dt>
            <dd>
              {new Date(
                receipt.contributionPeriod.slice(0, 7) + "-01T00:00:00+03:00",
              ).toLocaleDateString("en-KE", {
                month: "long",
                year: "numeric",
                timeZone: "Africa/Nairobi",
              })}
            </dd>
          </div>

          <div>
            <dt>Received on</dt>
            <dd>
              {receipt.receivedAt
                ? new Date(receipt.receivedAt).toLocaleString("en-KE", {
                    timeZone: "Africa/Nairobi",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Not available"}
            </dd>
          </div>
        </dl>

        <Separator />

        {!completed && (
          <p className="receipt-notice">
            Cash received · {receipt.status.replaceAll("_", " ")} · Balances are
            not yet confirmed.
          </p>
        )}

        <div className="receipt-columns">
          <section
            aria-label={
              completed ? "Contribution payments" : "Recorded allocation plan"
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">
                    {completed ? "Being paid for" : "Recorded allocation plan"}
                  </TableHead>
                  <TableHead scope="col">Amt. paid</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {allocations.map((item) => {
                  const [label, ...reason] = (
                    item.displayLabel || allocationLabel(item.type)
                  ).split(" · ");

                  return (
                    <TableRow key={item.type + (item.targetId ?? "general")}>
                      <TableCell>
                        {label}

                        {reason.length > 0 && (
                          <small>{reason.join(" · ")}</small>
                        )}

                        {!completed && (
                          <small>{item.status.replaceAll("_", " ")}</small>
                        )}
                      </TableCell>

                      <TableCell>{formatMoney(item.amount)}</TableCell>
                    </TableRow>
                  );
                })}

                <TableRow data-highlight="true">
                  <TableCell>
                    Current share balance
                    <small>Balance at the time of lookup</small>
                  </TableCell>

                  <TableCell>
                    {!needsShareBalance ? (
                      "Not applicable"
                    ) : completed ? (
                      loadingDetails ? (
                        <>
                          <Skeleton className="ml-auto h-4 w-24 print:hidden" />
                          <span className="hidden print:inline">
                            Loading balance
                          </span>
                        </>
                      ) : (
                        formatMoney(shareBalance)
                      )
                    ) : (
                      "Pending allocation"
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <p className="receipt-note">
              Loan payments include principal, interest, penalties and any
              credit shown alongside.
            </p>
          </section>

          <section aria-label="Saved loan payment breakdown">
            {!completed ? (
              <p className="receipt-note">
                Loan details will appear when processing is complete.
              </p>
            ) : !receipt.loanSnapshotAvailable ? (
              <p className="receipt-note">
                Loan details are not available on this receipt. Check the loan
                ledger for payment history.
              </p>
            ) : !receipt.loans?.length ? (
              <p className="receipt-note">
                No loan payments were due when this receipt was issued.
              </p>
            ) : (
              receipt.loans.map((loan) => (
                <div className="receipt-loan" key={loan.loanId}>
                  <h2>Loan payment · {loan.period.slice(0, 7)}</h2>

                  {!loan.payable ? (
                    <p className="receipt-note">
                      No payment was due for this loan in this period.
                    </p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Loan details</TableHead>
                            <TableHead scope="col">Amount (KES)</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {[
                            [
                              "Opening principal for the month",
                              loan.openingPrincipal,
                            ],
                            ["Principal before payment", loan.principalDue],
                            ["Interest for this month", loan.periodInterest],
                            [
                              "Unpaid earlier interest",
                              loan.earlierInterestDue,
                            ],
                            ["Interest owed before payment", loan.interestDue],
                            ["Penalties owed", loan.penaltyDue],
                            ["Loan payment received", loan.payment],
                            ["Principal paid", loan.principalPaid],
                            ["Interest paid", loan.interestPaid],
                            ["Penalties paid", loan.penaltyPaid],
                            ["Overpayment credit", loan.credit],
                            [
                              "Interest remaining unpaid",
                              loan.interestRemaining,
                            ],
                            [
                              "Principal after payment",
                              loan.principalRemaining,
                            ],
                          ].map(([label, value]) => {
                            const [whole, fraction = ""] = value.split(".");

                            return (
                              <TableRow
                                key={label}
                                data-highlight={
                                  label === "Principal after payment" ||
                                  undefined
                                }
                              >
                                <TableCell>{label}</TableCell>

                                <TableCell>
                                  {whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.
                                  {fraction.padEnd(2, "0")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>

                      <p className="receipt-note">
                        Monthly rate: {Number(loan.interestRate) * 100}%.
                        Figures are saved as they were when this payment was
                        recorded.
                      </p>
                    </>
                  )}
                </div>
              ))
            )}

            <Table aria-label="Total cash received">
              <TableBody>
                <TableRow data-highlight="true" className="receipt-total">
                  <TableCell>Total amount paid</TableCell>
                  <TableCell>{formatMoney(receipt.amount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>
        </div>

        <Separator />

        <p className="receipt-words">
          <strong>Amount in words: </strong>
          {receipt.amount
            ? amountWords(BigInt(receipt.amount.units || "0")) +
              " shillings and " +
              amountWords(
                BigInt(Math.floor((receipt.amount.nanos || 0) / 10_000_000)),
              ) +
              " cents"
            : "Not available"}
        </p>

        <footer className="receipt-footer">
          <p>
            Payment method<strong>Cash</strong>
          </p>

          <div className="receipt-signature">
            <span>Sign</span>
          </div>

          <div className="receipt-stamp">
            <span>Stamp</span>
          </div>
        </footer>
      </article>

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
