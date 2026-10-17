"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { cashCustodyAction, type CashMutationState } from "@/app/dashboard/contributions/actions";
import type { CashierSession } from "@/lib/go-api-client";
import { staffLabel, custodyDate, formatMoney, moneyDecimal } from "./contribution-utils";
import { cn } from "@/lib/utils";

// Keeps the selected till and confirmation with its queue; the parent needs no handover state.
export function AwaitingHandover({
  awaiting,
  context,
  disabled,
  onBusyChange,
  onSuccess,
}: {
  awaiting: CashierSession[];
  context: { canApprove: boolean; staffId: string };
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => Promise<void>;
}) {
  const [handover, setHandover] = useState<CashierSession | null>(null);
  const [submittedId, setSubmittedId] = useState("");
  const [state, action, pending] = useActionState(async (previous: CashMutationState, data: FormData) => {
    onBusyChange(true);
    setSubmittedId(String(data.get("sessionId")));
    try {
      const result = await cashCustodyAction(previous, data).catch(() => ({
        ok: false as const, retry: true, message: "Handover could not be confirmed. Refresh custody or retry.",
      }));
      if (result?.ok) {
        await onSuccess();
        setHandover(null);
      }
      return result;
    } finally { onBusyChange(false); }
  }, null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Awaiting handover</h3>
        <Badge variant="pending">{awaiting.length} pending</Badge>
      </div>
      {state?.ok && !pending ? <Alert>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert> : null}
      {awaiting.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No tills awaiting handover</EmptyTitle>
            <EmptyDescription>Closed, counted tills appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : awaiting.map((session) => (
        <article className="flex flex-col gap-3 rounded-lg border p-3" key={session.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h4 className="font-medium">{staffLabel(session.cashierName, session.cashierId)}</h4>
              <p className="text-xs text-muted-foreground">Till reference: {session.id.slice(0, 8)} · Closed {custodyDate(session.closedAt)}</p>
            </div>
            <Badge variant="pending">Pending</Badge>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Expected</dt>
              <dd className="tabular-nums">{formatMoney(session.expectedAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Counted</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(session.countedAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Variance</dt>
              <dd className={cn("tabular-nums", session.variance && Number(moneyDecimal(session.variance)) !== 0 && "text-destructive")}>
                {formatMoney(session.variance)}
              </dd>
            </div>
          </dl>
          {session.varianceReason ? <p className="text-sm text-muted-foreground">Reason: {session.varianceReason}</p> : null}
          {context.canApprove && session.cashierId !== context.staffId ? (
            <Button
              className="w-full"
              variant="brand-soft"
              disabled={disabled}
              onClick={() => setHandover(session)}
            >Review and accept handover</Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {session.cashierId === context.staffId ? "Another authorized staff member must accept your cash." : "An authorized staff member must accept this handover."}
            </p>
          )}
        </article>
      ))}
      <Dialog open={Boolean(handover)} onOpenChange={(open) => { if (!open && !pending) setHandover(null); }}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Accept cash handover</DialogTitle>
            <DialogDescription>Confirm you received the physical cash from {staffLabel(handover?.cashierName, handover?.cashierId)}.</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Expected</dt>
              <dd>{formatMoney(handover?.expectedAmount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Counted</dt>
              <dd className="font-semibold">{formatMoney(handover?.countedAmount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Variance</dt>
              <dd>{formatMoney(handover?.variance)}</dd>
            </div>
          </dl>
          {handover?.varianceReason ? <p className="text-sm text-muted-foreground">Reason: {handover.varianceReason}</p> : null}
          {state?.ok === false && submittedId === handover?.id ? <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert> : null}
          <DialogFooter>
            <Button
              variant="brand-outline"
              disabled={pending}
              onClick={() => setHandover(null)}
            >Cancel</Button>
            <form action={action}>
              <input
                type="hidden"
                name="operation"
                value="handover"
              />
              <input
                type="hidden"
                name="sessionId"
                value={handover?.id ?? ""}
              />
              <Button type="submit" disabled={disabled || pending} variant="brand">
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Accepting..." : "Confirm handover"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
