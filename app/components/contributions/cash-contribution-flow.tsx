"use client";

import { useActionState, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";
import {
  closeCashierSessionAction,
  findCashMemberAction,
  openCashierSessionAction,
  recordCashContributionAction,
  type CashMemberState,
  type CashMutationState,
} from "@/app/dashboard/contributions/actions";
import { CloseTillStep } from "./close-till-step";
import { ContributionEntryStep } from "./contribution-entry-step";
import { ContributionProgress } from "./contribution-progress";
import { emptyAmounts, type ContributionDraft } from "./contribution-utils";
import { MemberLookupStep } from "./member-lookup-step";
import { OpenTillStep } from "./open-till-step";
import { ReceiptStep } from "./receipt-step";
import { ReviewContributionStep } from "./review-contribution-step";

// CashStep limits navigation to the concrete cashier stages rendered by this flow.
type CashStep = "till" | "member" | "entry" | "review" | "receipt" | "close";

// CashContributionFlow coordinates one visible cashier stage and preserves retry idempotency.
export function CashContributionFlow() {
  const submission = useRef<FormData | null>(null);
  const [step, setStep] = useState<CashStep>("till");
  const [hideMemberState, setHideMemberState] = useState(false);
  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [amounts, setAmounts] = useState(emptyAmounts());
  const [memberState, findAction, finding] = useActionState(
    async (previous: CashMemberState, data: FormData) => {
      const result = await findCashMemberAction(previous, data);
      setHideMemberState(false);
      if (result?.ok) {
        setAmounts(emptyAmounts(result.loans));
        setDraft(null);
        submission.current = null;
        setStep("entry");
        toast.add({
          title: "Member ready",
          description: `Member ${result.member.memberNumber} was found.`,
          type: "success",
        });
      } else if (result)
        toast.add({
          title: "Member not found",
          description: result.message,
          type: "error",
        });
      return result;
    },
    null,
  );
  const [openState, openAction, opening] = useActionState(async () => {
    const result = await openCashierSessionAction();
    if (result?.ok) {
      setStep("member");
      toast.add({
        title: "Till ready",
        description: result.message,
        type: "success",
      });
    } else if (result)
      toast.add({
        title: "Till unavailable",
        description: result.message,
        type: "error",
      });
    return result;
  }, null);
  const [recordState, recordAction, recording] = useActionState(
    async (previous: CashMutationState, data: FormData) => {
      if (!submission.current && draft) {
        data.set("idempotencyKey", crypto.randomUUID());
        data.set("allocations", JSON.stringify(draft.allocations));
        submission.current = data;
      }
      const result = await recordCashContributionAction(
        previous,
        submission.current ?? data,
      );
      if (result?.ok) {
        submission.current = null;
        setStep("receipt");
        toast.add({
          title:
            result.receipt?.status === "manual_review"
              ? "Review required"
              : "Contribution recorded",
          description: result.message,
          type:
            result.receipt?.status === "manual_review" ? "warning" : "success",
        });
      } else if (result) {
        if (!result.retry) submission.current = null;
        toast.add({
          title: "Contribution not recorded",
          description: result.message,
          type: "error",
        });
      }
      return result;
    },
    null,
  );
  const [closeState, closeAction, closing] = useActionState(
    async (previous: CashMutationState, data: FormData) => {
      const result = await closeCashierSessionAction(previous, data);
      toast.add({
        title: result?.ok ? "Till closed" : "Till not closed",
        description: result?.message,
        type: result?.ok ? "success" : "error",
      });
      return result;
    },
    null,
  );
  const session =
    closeState?.ok && closeState.session
      ? closeState.session
      : openState?.ok
        ? openState.session
        : undefined;
  const member = memberState?.ok ? memberState : undefined;
  return (
    <div className="flex flex-col gap-5">
      <ContributionProgress step={step} />
      {step === "till" ? (
        <OpenTillStep action={openAction} pending={opening} state={openState} />
      ) : null}
      {step === "member" ? (
        <MemberLookupStep
          action={findAction}
          onCloseTill={() => setStep("close")}
          pending={finding}
          state={hideMemberState ? null : memberState}
        />
      ) : null}
      {step === "entry" && member ? (
        <ContributionEntryStep
          amounts={amounts}
          initialPeriod={draft?.contributionPeriod}
          key={member.member.id}
          memberState={member}
          onBack={() => {
            setHideMemberState(true);
            setStep("member");
          }}
          onReview={(value) => {
            setDraft(value);
            setStep("review");
          }}
          setAmounts={setAmounts}
        />
      ) : null}
      {step === "review" && member && draft && session ? (
        <ReviewContributionStep
          action={recordAction}
          draft={draft}
          memberState={member}
          onBack={() => setStep("entry")}
          pending={recording}
          sessionId={session.id}
          state={recordState}
        />
      ) : null}
      {step === "receipt" && member && draft && recordState?.ok ? (
        <ReceiptStep
          draft={draft}
          memberState={member}
          onAnotherMember={() => {
            setHideMemberState(true);
            setStep("member");
          }}
          onCloseTill={() => setStep("close")}
          state={recordState}
        />
      ) : null}
      {step === "close" && session ? (
        <CloseTillStep
          action={closeAction}
          onBack={() => setStep("member")}
          pending={closing}
          sessionId={session.id}
          state={closeState}
        />
      ) : null}
    </div>
  );
}
