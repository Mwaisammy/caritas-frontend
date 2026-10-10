import { ArrowLeftIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type {
  CashMemberState,
  CashMutationState,
} from "@/app/dashboard/contributions/actions";
import {
  allocationLabel,
  formatDecimalMoney,
  type ContributionDraft,
} from "./contribution-utils";

// ReviewContributionStep confirms the immutable allocation before cash is recorded.
export function ReviewContributionStep({
  action,
  draft,
  memberState,
  onBack,
  pending,
  sessionId,
  state,
}: {
  action: (data: FormData) => void;
  draft: ContributionDraft;
  memberState: Extract<CashMemberState, { ok: true }>;
  onBack: () => void;
  pending: boolean;
  sessionId: string;
  state: CashMutationState;
}) {
  const locked = state?.ok === false && Boolean(state.retry);
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Review contribution</CardTitle>
        <CardDescription>
          Confirm the member, period, and full cash allocation before recording.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Member</span>
            <br />
            {memberState.member.profile?.personal?.fullName ?? "Unnamed member"}
          </p>
          <p>
            <span className="text-muted-foreground">Member number</span>
            <br />
            {memberState.member.memberNumber}
          </p>
          <p>
            <span className="text-muted-foreground">Contribution period</span>
            <br />
            {draft.contributionPeriod}
          </p>
          <p>
            <span className="text-muted-foreground">Total cash</span>
            <br />
            <strong>{formatDecimalMoney(draft.amount)}</strong>
          </p>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          {draft.allocations.map((item) => (
            <div
              className="flex items-center justify-between gap-4"
              key={`${item.type}-${item.targetId ?? "general"}`}
            >
              <span>
                {allocationLabel(item.type)}
                {item.targetId ? ` · ${item.targetId.slice(0, 8)}` : ""}
              </span>
              <strong>{formatDecimalMoney(item.amount)}</strong>
            </div>
          ))}
        </div>
        {state?.ok === false ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <form action={action}>
          <input name="amount" type="hidden" value={draft.amount} />
          <input
            name="contributionPeriod"
            type="hidden"
            value={draft.contributionPeriod}
          />
          <input name="memberId" type="hidden" value={memberState.member.id} />
          <input name="sessionId" type="hidden" value={sessionId} />
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <CheckIcon data-icon="inline-start" />
            )}
            {pending
              ? "Recording cash..."
              : locked
                ? "Retry same contribution"
                : "Record cash contribution"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          disabled={pending || locked}
          onClick={onBack}
          type="button"
          variant="ghost"
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Edit contribution
        </Button>
      </CardFooter>
    </Card>
  );
}
