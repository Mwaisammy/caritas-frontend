import { ContributionWorkspace } from "@/app/components/contributions/contribution-workspace";

// ContributionsPage keeps collection and custody visible as distinct staff operations.
export default function ContributionsPage() {
  return (
    <div className="min-h-full bg-muted/30 px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 py-7">
          <p className="text-sm font-medium text-muted-foreground">
            Collection workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Contributions
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Confirm the member and allocate a contribution collected by cash or M-Pesa.
          </p>
        </header>
        <ContributionWorkspace />
      </div>
    </div>
  );
}
