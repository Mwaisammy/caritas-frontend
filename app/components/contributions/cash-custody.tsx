"use client";

import { Fragment, useEffect, useState } from "react";
import { ArrowRightIcon, HandCoinsIcon, LandmarkIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { loadCashCustodyAction } from "@/app/dashboard/contributions/actions";
import type { CashDeposit } from "@/lib/go-api-client";
import { cn } from "@/lib/utils";
import { AwaitingHandover } from "./awaiting-handover";
import { ReadyForDeposit } from "./ready-for-deposit";
import { AwaitingVerification } from "./awaiting-verification";
import { CashCustodyHistory } from "./cash-custody-history";
import { CashDepositDetails } from "./cash-deposit-details";

// Owns shared records and navigation; each section keeps its own form and recovery state.
export function CashCustody() {
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof loadCashCustodyAction>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("handover");
  const [details, setDetails] = useState<CashDeposit | null>(null);

  useEffect(() => {
    let active = true;
    loadCashCustodyAction().catch(() => ({
      ok: false as const, message: "Cash custody could not load. Use Refresh to try again.",
    })).then((result) => {
      if (active) {
        setWorkspace(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const current = workspace?.ok ? workspace : undefined;
  const disabled = loading || busy || Boolean(error);
  const awaiting = current?.sessions.filter((session) => session.status === "closed") ?? [];
  const ready = current?.sessions.filter((session) => session.status === "handed_over" && session.countedAmount) ?? [];
  const recorded = current?.deposits.filter((deposit) => deposit.status === "recorded") ?? [];
  const verified = current?.deposits.filter((deposit) => deposit.status === "verified") ?? [];

  // One loader preserves the other list when paging and blocks stale mutations after a failed refresh.
  async function refresh(page: "all" | "sessions" | "deposits" = "all") {
    setLoading(true);
    const result = await loadCashCustodyAction(
      page === "sessions" ? current?.sessionToken : "",
      page === "deposits" ? current?.depositToken : "",
    ).catch(() => ({ ok: false as const, message: "Cash custody could not refresh. Use Refresh before taking another action." }));
    if (result.ok) {
      setWorkspace(current && page !== "all" ? {
        ...result,
        sessions: page === "sessions" ? [...current.sessions, ...result.sessions] : current.sessions,
        sessionToken: page === "sessions" ? result.sessionToken : current.sessionToken,
        deposits: page === "deposits" ? [...current.deposits, ...result.deposits] : current.deposits,
        depositToken: page === "deposits" ? result.depositToken : current.depositToken,
      } : result);
      setError("");
    } else setError(result.message);
    setLoading(false);
  }

  return (
    <section
      className="flex flex-col gap-6 rounded-xl border bg-card p-4 text-card-foreground sm:p-5 print:hidden"
      aria-label="Cash custody"
      aria-busy={loading}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Cash Custody</h2>
          <p className="text-sm text-muted-foreground">Manage cash handovers, bank deposits and verification.</p>
        </div>
        <Button
          variant="brand-outline"
          size="sm"
          disabled={loading || busy}
          onClick={() => refresh()}
        >
          {loading ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
          Refresh
        </Button>
      </div>
      {error || workspace?.ok === false ? (
        <Alert variant="destructive">
          <AlertDescription>{error || (workspace?.ok === false ? workspace.message : "")}</AlertDescription>
        </Alert>
      ) : null}
      {!workspace && loading ? <Skeleton className="h-44 w-full" /> : null}
      {current ? (
        <>
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: "Awaiting handover", count: awaiting.length, description: "Tills to accept", color: "text-status-pending" },
              { label: "Ready for deposit", count: ready.length, description: "Accepted tills", color: "text-status-ready" },
              { label: "Awaiting verification", count: recorded.length, description: "Recorded deposits", color: "text-status-pending" },
              { label: "Verified deposits", count: verified.length, description: "Completed checks", color: "text-status-verified" },
            ].map((item) => (
              <div className="flex flex-col gap-1 rounded-lg border p-3" key={item.label}>
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-1.5 shrink-0 rounded-full bg-current", item.color)} aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className={cn("text-2xl font-semibold tabular-nums", item.color)}>{String(item.count).padStart(2, "0")}</dd>
                <dd className="text-xs text-muted-foreground">{item.description}</dd>
              </div>
            ))}
          </dl>
          {current.sessionToken || current.depositToken ? <p className="-mt-3 text-xs text-muted-foreground">Counts reflect loaded records.</p> : null}
          <Separator />
          <div className="flex flex-col gap-3">
            <h3 id="cash-processing" className="text-sm font-semibold">Cash processing</h3>
            <p className="text-sm text-muted-foreground">Follow the process from left to right, or select a stage to see its outstanding tasks.</p>
            <ToggleGroup
              className="w-full"
              variant="brand"
              value={[stage]}
              disabled={loading || busy}
              aria-labelledby="cash-processing"
              onValueChange={(values) => { if (values[0]) setStage(values[0]); }}
            >
              {[
                { value: "handover", label: "Handover", icon: HandCoinsIcon },
                { value: "deposit", label: "Deposit", icon: LandmarkIcon },
                { value: "verify", label: "Verify", icon: ShieldCheckIcon },
              ].map((item, index) => (
                <Fragment key={item.value}>
                  {index > 0 ? <ArrowRightIcon className="size-3 shrink-0" aria-hidden="true" /> : null}
                  <ToggleGroupItem className="h-16 min-w-0 flex-1 cursor-pointer flex-col gap-1" value={item.value}>
                    <item.icon aria-hidden="true" />{item.label}
                  </ToggleGroupItem>
                </Fragment>
              ))}
            </ToggleGroup>
          </div>
          <Separator />
          <div hidden={stage !== "handover"}>
            <AwaitingHandover
              awaiting={awaiting}
              context={current.context}
              disabled={disabled}
              onBusyChange={setBusy}
              onSuccess={refresh}
            />
          </div>
          <ReadyForDeposit
            ready={ready}
            context={current.context}
            visible={stage === "deposit"}
            disabled={disabled}
            onBusyChange={setBusy}
            onSuccess={refresh}
          />
          <div hidden={stage !== "verify"}>
            <AwaitingVerification
              deposits={recorded}
              context={current.context}
              disabled={disabled}
              onBusyChange={setBusy}
              onSuccess={refresh}
              onViewDetails={setDetails}
              hasMore={Boolean(current.depositToken)}
              onLoadMore={() => refresh("deposits")}
            />
          </div>
          <Separator />
          <CashCustodyHistory
            sessions={current.sessions}
            deposits={verified}
            sessionToken={current.sessionToken}
            depositToken={current.depositToken}
            busy={loading || busy}
            disabled={disabled}
            onViewDetails={setDetails}
            onLoadMoreSessions={() => refresh("sessions")}
            onLoadMoreDeposits={() => refresh("deposits")}
          />
          {details ? <CashDepositDetails
            key={details.id}
            deposit={details}
            sessions={current.sessions}
            onClose={() => setDetails(null)}
          /> : null}
        </>
      ) : null}
    </section>
  );
}
