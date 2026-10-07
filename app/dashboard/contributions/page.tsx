import { CashContributionFlow } from "@/app/components/contributions/cash-contribution-flow";

// ContributionsPage introduces the cashier workflow without mixing in manager reconciliation.
export default function ContributionsPage() {
  return (
    <div className="min-h-full bg-muted/30 px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 py-7">
          <p className="text-sm font-medium text-muted-foreground">
            Cashier workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Cash contributions
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Open your till, confirm the member, allocate the cash, and close
            with an authoritative count.
          </p>
        </header>
        <CashContributionFlow />
      </div>
    </div>
  );
}
