"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { cashCustodyAction, type CashMutationState } from "@/app/dashboard/contributions/actions";
import type { CashDeposit } from "@/lib/go-api-client";
import { staffLabel, custodyDate, formatMoney } from "./contribution-utils";

// Owns verification feedback so the page only supplies records and refreshes them after success.
export function AwaitingVerification({
  deposits,
  context,
  disabled,
  onBusyChange,
  onSuccess,
  onViewDetails,
  hasMore,
  onLoadMore,
}: {
  deposits: CashDeposit[];
  context: { canApprove: boolean; staffId: string };
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => Promise<void>;
  onViewDetails: (deposit: CashDeposit) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const [activeId, setActiveId] = useState("");
  const [state, action, pending] = useActionState(async (previous: CashMutationState, data: FormData) => {
    onBusyChange(true);
    setActiveId(String(data.get("depositId")));
    try {
      const result = await cashCustodyAction(previous, data).catch(() => ({
        ok: false as const, retry: true, message: "Verification could not be confirmed. Refresh custody or retry.",
      }));
      if (result?.ok) await onSuccess();
      return result;
    } finally { onBusyChange(false); }
  }, null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Awaiting verification</h3>
        <Badge variant="pending">{deposits.length} pending</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Check bank evidence independently. The recorder cannot verify their own deposit.</p>
      {state && !pending ? <Alert variant={state.ok ? "default" : "destructive"}>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert> : null}
      {deposits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No deposits awaiting verification</EmptyTitle>
            <EmptyDescription>Recorded bank deposits appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : deposits.map((deposit) => (
        <article className="flex flex-col gap-3 rounded-lg border p-3" key={deposit.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <h4 className="break-all font-medium">{deposit.bankReference}</h4>
              <p className="text-xs text-muted-foreground">Recorded by {staffLabel(deposit.recordedByName, deposit.recordedBy)} · {custodyDate(deposit.recordedAt)}</p>
            </div>
            <p className="font-semibold tabular-nums">{formatMoney(deposit.amount)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="brand-outline"
              disabled={disabled}
              onClick={() => onViewDetails(deposit)}
            >View details</Button>
            {context.canApprove && deposit.recordedBy !== context.staffId ? (
              <form action={action} className="flex-1">
                <input
                  type="hidden"
                  name="operation"
                  value="verify"
                />
                <input
                  type="hidden"
                  name="depositId"
                  value={deposit.id}
                />
                <Button
                  className="w-full"
                  type="submit"
                  disabled={disabled || pending}
                  variant="brand"
                >
                  {pending && activeId === deposit.id ? <Spinner data-icon="inline-start" /> : null}
                  {pending && activeId === deposit.id ? "Verifying..." : "Verify bank evidence"}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">Another authorized staff member must verify this deposit.</p>
            )}
          </div>
        </article>
      ))}
      {hasMore ? <Button
        className="self-start"
        variant="brand-outline"
        disabled={disabled}
        onClick={onLoadMore}
      >Load more deposits</Button> : null}
    </div>
  );
}
