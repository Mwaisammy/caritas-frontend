"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cashCustodyAction, type CashMutationState } from "@/app/dashboard/contributions/actions";
import type { CashDeposit, CashierSession } from "@/lib/go-api-client";
import { custodyDate, formatMoney, staffLabel } from "./contribution-utils";

// Both verification and history need authoritative deposit details; one dialog avoids duplicating the fetch and audit display.
export function CashDepositDetails({
  deposit,
  sessions,
  onClose,
}: {
  deposit: CashDeposit;
  sessions: CashierSession[];
  onClose: () => void;
}) {
  const [result, setResult] = useState<CashMutationState>(null);
  useEffect(() => {
    let active = true;
    const data = new FormData();
    data.set("operation", "details");
    data.set("depositId", deposit.id);
    cashCustodyAction(null, data).catch(() => ({
      ok: false as const, message: "Deposit details could not load.",
    })).then((response) => {
      if (active) setResult(response ?? { ok: false, message: "Deposit details could not load." });
    });
    return () => { active = false; };
  }, [deposit.id]);

  const detailsLoading = result === null;
  const details = result?.ok ? result.deposit : null;
  const detailsError = result && !details ? result.message : "";
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !detailsLoading) onClose();
      }}
    >
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!detailsLoading}
      >
        <DialogHeader>
          <DialogTitle>Bank deposit details</DialogTitle>
          <DialogDescription>{details?.bankReference ?? deposit.bankReference}</DialogDescription>
        </DialogHeader>
        {detailsLoading ? (
          <div className="flex flex-col gap-3" role="status">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <span className="sr-only">Loading deposit details…</span>
          </div>
        ) : detailsError ? (
          <Alert variant="destructive">
            <AlertTitle>Details could not load</AlertTitle>
            <AlertDescription>
              {detailsError} Close this dialog and select View details to
              retry.
            </AlertDescription>
          </Alert>
        ) : details ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-semibold tabular-nums">
                {formatMoney(details.amount)}
              </p>
              <Badge variant={details.status === "verified" ? "verified" : "pending"}>
                {details.status === "verified"
                  ? "Verified"
                  : "Awaiting verification"}
              </Badge>
            </div>
            <dl className="flex flex-col gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Recorded by</dt>
                <dd>
                  {staffLabel(details.recordedByName, details.recordedBy)} ·{" "}
                  {custodyDate(details.recordedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Verified by</dt>
                <dd>
                  {details.verifiedBy
                    ? `${staffLabel(details.verifiedByName, details.verifiedBy)} · ${custodyDate(details.verifiedAt)}`
                    : "Awaiting independent verification"}
                </dd>
              </div>
            </dl>
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Included tills</h3>
              {details.sessionIds?.length ? (
                details.sessionIds.map((id) => {
                  const session = sessions.find(
                    (item) => item.id === id,
                  );
                  return (
                    <div className="flex flex-col gap-1 text-sm" key={id}>
                      <p className="font-medium">
                        {session
                          ? staffLabel(session.cashierName, session.cashierId)
                          : `Till · ${id.slice(0, 8)}`}
                        {session?.countedAmount
                          ? ` · ${formatMoney(session.countedAmount)}`
                          : ""}
                      </p>
                      <p className="break-all text-xs text-muted-foreground">
                        Till reference: {id}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked tills returned.
                </p>
              )}
            </div>
            <p className="break-all text-xs text-muted-foreground">
              Deposit reference: {details.id}
            </p>
          </>
        ) : null}
        <DialogFooter>
          <Button
            variant="brand-outline"
            disabled={detailsLoading}
            onClick={() => onClose()}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
}
