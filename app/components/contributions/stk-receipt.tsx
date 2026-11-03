import type { ContributionPaymentRequest } from "@/lib/go-api-client";
import type { CashMemberState } from "@/app/dashboard/contributions/actions";
import { formatMoney, formatReceiptLoanAmount } from "./contribution-utils";
import { ContributionPrintReceipt } from "./contribution-print-receipt";

// STKReceipt puts authoritative M-Pesa receipt details in the shared print layout.
export function STKReceipt({
  receipt,
  member,
  period,
  phone,
  completed,
}: {
  receipt: NonNullable<ContributionPaymentRequest["receipt"]>;
  member: Extract<CashMemberState, { ok: true }> | null;
  period: string;
  phone: string;
  completed: boolean;
}) {
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
  const periodLabel = period
    ? new Date(`${period}-01T00:00:00+03:00`).toLocaleDateString("en-KE", {
        month: "long",
        year: "numeric",
        timeZone: "Africa/Nairobi",
      })
    : "Not available";

  return (
    <ContributionPrintReceipt
      receiptNumber={receipt.mpesaReference || "Not available"}
      memberNumber={member?.member.memberNumber ?? "Not available"}
      memberName={
        member?.member.profile?.personal?.fullName ?? "Unnamed member"
      }
      period={periodLabel}
      receivedOn={
        receipt.receivedAt
          ? new Date(receipt.receivedAt).toLocaleString("en-KE", {
              timeZone: "Africa/Nairobi",
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Not available"
      }
      paymentMethod="M-Pesa"
      paymentDetailLabel="Phone"
      paymentDetail={phone || "Not available"}
      amount={receipt.amount}
      contributionRows={[
        {
          label: "M-Pesa payment received",
          value: formatMoney(receipt.amount).replace(/^KES /, ""),
        },
      ]}
      loanRows={loanRows}
      notice={
        !completed
          ? "Payment received · Allocations are not yet confirmed."
          : undefined
      }
    />
  );
}
