"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type { CashierSession, CashDeposit } from "@/lib/go-api-client";
import { staffLabel, custodyDate, formatMoney } from "./contribution-utils";

// Keeps audit records collapsed without removing their details or independent pagination.
export function CashCustodyHistory({
  sessions,
  deposits,
  sessionToken,
  depositToken,
  busy,
  disabled,
  onViewDetails,
  onLoadMoreSessions,
  onLoadMoreDeposits,
}: {
  sessions: CashierSession[];
  deposits: CashDeposit[];
  sessionToken?: string;
  depositToken?: string;
  busy: boolean;
  disabled: boolean;
  onViewDetails: (deposit: CashDeposit) => void;
  onLoadMoreSessions: () => void;
  onLoadMoreDeposits: () => void;
}) {
  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium">
        Till activity and references
        <span className="mt-1 block text-xs font-normal text-muted-foreground">Keep historical records collapsed until needed.</span>
      </summary>
      <div className="mt-5 flex flex-col gap-4">
        <h4 className="text-sm font-semibold">Verified deposits</h4>
        {deposits.length === 0 ? <Empty>
          <EmptyHeader>
            <EmptyTitle>No verified deposits yet</EmptyTitle>
          </EmptyHeader>
        </Empty> : null}
        {deposits.map((deposit) => (
          <div className="flex flex-wrap items-center justify-between gap-3" key={deposit.id}>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="break-all text-sm font-medium">
                {deposit.bankReference} · {formatMoney(deposit.amount)} <Badge variant="verified">Verified</Badge>
              </p>
              <p className="text-xs text-muted-foreground">Recorded by {staffLabel(deposit.recordedByName, deposit.recordedBy)} · {custodyDate(deposit.recordedAt)}</p>
              <p className="text-xs text-muted-foreground">Verified by {staffLabel(deposit.verifiedByName, deposit.verifiedBy)} · {custodyDate(deposit.verifiedAt)}</p>
            </div>
            <Button
              variant="brand-outline"
              disabled={disabled}
              onClick={() => onViewDetails(deposit)}
            >View details</Button>
          </div>
        ))}
        {depositToken ? <Button
          className="self-start"
          variant="brand-outline"
          disabled={busy}
          onClick={onLoadMoreDeposits}
        >Load more deposits</Button> : null}
        <Separator />
        <h4 className="text-sm font-semibold">Till activity</h4>
        {sessions.length === 0 ? <Empty>
          <EmptyHeader>
            <EmptyTitle>No till activity yet</EmptyTitle>
          </EmptyHeader>
        </Empty> : null}
        {sessions.map((session) => (
          <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm" key={session.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{staffLabel(session.cashierName, session.cashierId)}</p>
              <Badge variant={session.status === "open" ? "outline" : session.status === "closed" ? "pending" : "ready"}>
                {{ open: "Collecting cash", closed: "Awaiting handover", handed_over: "Ready for deposit", deposited: "Deposited" }[session.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Expected {formatMoney(session.expectedAmount)} · Counted {session.countedAmount ? formatMoney(session.countedAmount) : "Not counted"}
            </p>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Opened</dt>
                <dd>{custodyDate(session.openedAt)}</dd>
              </div>
              {session.closedAt ? <div>
                <dt className="text-muted-foreground">Closed</dt>
                <dd>{custodyDate(session.closedAt)}</dd>
              </div> : null}
              {session.handedOverTo ? (
                <div>
                  <dt className="text-muted-foreground">Accepted by {staffLabel(session.handedOverToName, session.handedOverTo)}</dt>
                  <dd>{custodyDate(session.handedOverAt)}</dd>
                </div>
              ) : null}
              {session.depositedAt ? <div>
                <dt className="text-muted-foreground">Deposited</dt>
                <dd>{custodyDate(session.depositedAt)}</dd>
              </div> : null}
            </dl>
            <p className="break-all text-xs text-muted-foreground">Till reference: {session.id}</p>
          </div>
        ))}
        {sessionToken ? <Button
          className="self-start"
          variant="brand-outline"
          disabled={busy}
          onClick={onLoadMoreSessions}
        >Load more tills</Button> : null}
        {sessionToken || depositToken ? <p className="text-xs text-muted-foreground">Showing loaded records. Load more to view older activity.</p> : null}
      </div>
    </details>
  );
}
