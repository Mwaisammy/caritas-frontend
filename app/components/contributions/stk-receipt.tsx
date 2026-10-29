import {Separator} from "@/components/ui/separator";
import type {ContributionPaymentRequest} from "@/lib/go-api-client";
import {formatMoney} from "./contribution-utils";
import {LoanContributionBreakdown} from "./loan-contribution-breakdown";
import type {CashMemberState} from "@/app/dashboard/contributions/actions";

// STKReceipt presents only M-Pesa receipt facts returned by the backend.
export function STKReceipt({
  receipt,
  member,
  period,
  phone,
  completed,
}: {
  receipt: NonNullable<ContributionPaymentRequest["receipt"]>;
  member: Extract<CashMemberState, {ok: true}> | null;
  period: string;
  phone: string;
  completed: boolean;
}) {
  return (
    <>
      <article
        className="cash-receipt"
        aria-label="M-Pesa contribution receipt"
      >
        <header className="receipt-heading">
          <h1>Our Lady of Consolata Sagana Kabiruini Parish</h1>
          <p>Caritas SACCO · M-Pesa contribution receipt</p>
        </header>
        <Separator />
        <dl className="receipt-member">
          <div>
            <dt>Receipt No.</dt>
            <dd>{receipt.mpesaReference || "Not available"}</dd>
          </div>
          <div>
            <dt>Member No.</dt>
            <dd>{member?.member.memberNumber ?? "Not available"}</dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>
              {member?.member.profile?.personal?.fullName ?? "Not available"}
            </dd>
          </div>
          <div>
            <dt>For month</dt>
            <dd>{period || "Not available"}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{formatMoney(receipt.amount)}</dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>M-Pesa</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{phone || "Not available"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{receipt.status.replaceAll("_", " ")}</dd>
          </div>
          {receipt.receivedAt ? (
            <div>
              <dt>Received on</dt>
              <dd>
                {new Date(receipt.receivedAt).toLocaleString("en-KE", {
                  timeZone: "Africa/Nairobi",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          ) : null}
        </dl>
        {!completed ? (
          <p className="receipt-notice">
            Payment received · Allocations are not yet confirmed.
          </p>
        ) : null}
      </article>
      <LoanContributionBreakdown
        posted
        pending={!completed}
        loans={receipt.loans}
        snapshotAvailable={receipt.loanSnapshotAvailable}
      />
    </>
  );
}
