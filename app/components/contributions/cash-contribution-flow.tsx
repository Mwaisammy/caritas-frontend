"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CashContext, CashierSession } from "@/lib/go-api-client";
import {
  closeCashierSessionAction,
  findCashMemberAction,
  openCashierSessionAction,
  recordCashContributionAction,
  loadCashWorkspaceAction,
  recoverCashReceiptAction,
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

// CashStep names only rendered stages; removing it allows transitions to screens this flow cannot display.
type CashStep = "till" | "member" | "entry" | "review" | "receipt" | "close";

export function CashContributionFlow() {
  const submission = useRef<FormData | null>(null);
  const uncertain = useRef(false);
  const [context, setContext] = useState<CashContext | null>(null);
  const [startupError, setStartupError] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [step, setStep] = useState<CashStep>("till");
  const [session, setSession] = useState<CashierSession>();
  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [amounts, setAmounts] = useState(emptyAmounts());
  const [recordState, setRecordState] = useState<CashMutationState>(null);
  const [recording, startRecording] = useTransition();

  useEffect(() => {
    let active = true;
    loadCashWorkspaceAction()
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setStartupError(result.message);
          return;
        }
        setContext(result.context);
        try {
          const saved = sessionStorage.getItem(
            `cash-submission:${result.context.staffId}`,
          );
          if (saved) {
            const values: unknown = JSON.parse(saved);
            if (
              !Array.isArray(values) ||
              !values.every(
                (item) =>
                  Array.isArray(item) &&
                  item.length === 2 &&
                  item.every((value) => typeof value === "string"),
              )
            )
              throw new Error("invalid saved contribution");
            const data = new FormData();
            for (const [key, value] of values) data.set(key, value);
            submission.current = data;
            uncertain.current = true;
            setRecovery(true);
          }
        } catch {
          setStartupError(
            "Saved contribution could not be read. Restore browser storage before recording another payment.",
          );
        }
      })
      .catch(() => {
        if (active)
          setStartupError(
            "Cash workspace could not load. Reload the page to try again.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const [memberState, findAction, finding] = useActionState(
    async (previous: CashMemberState, data: FormData) => {
      const result = await findCashMemberAction(previous, data);
      if (result?.ok) {
        setAmounts(emptyAmounts(result.loans));
        setDraft(null);
        setRecordState(null);
        setStep("entry");
      }
      return result;
    },
    null,
  );
  const [openState, openAction, opening] = useActionState(async () => {
    const result = await openCashierSessionAction();
    if (result?.ok && result.session) {
      setSession(result.session);
      setStep("member");
    }
    return result;
  }, null);
  const [closeState, closeAction, closing] = useActionState(
    async (previous: CashMutationState, data: FormData) => {
      const result = await closeCashierSessionAction(previous, data);
      if (result?.ok && result.session) setSession(result.session);
      return result;
    },
    null,
  );

  const recordAction = (data: FormData) =>
    startRecording(async () => {
      if (!context) return;
      if (!submission.current) {
        if (!draft) return;
        data.set("idempotencyKey", crypto.randomUUID());
        data.set("allocations", JSON.stringify(draft.allocations));
        data.set("amount", draft.amount);
        // Persist before posting; without this write a refresh after a timeout could create a second receipt.
        try {
          sessionStorage.setItem(
            `cash-submission:${context.staffId}`,
            JSON.stringify(Array.from(data.entries())),
          );
        } catch {
          setRecordState({
            ok: false,
            message:
              "Browser storage is unavailable. Enable it before recording cash.",
          });
          return;
        }
        submission.current = data;
      }
      let result: CashMutationState;
      try {
        result = await recordCashContributionAction(null, submission.current);
      } catch {
        result = {
          ok: false,
          retry: true,
          message:
            "The result could not be confirmed. Check or retry the same contribution.",
        };
      }
      if (result?.ok) {
        try {
          sessionStorage.removeItem(`cash-submission:${context.staffId}`);
        } catch {
          setStartupError(
            "Receipt recorded, but browser recovery storage could not be cleared. Restore storage before another payment.",
          );
        }
        submission.current = null;
        uncertain.current = false;
        setRecovery(false);
        setStep("receipt");
      } else if (result) {
        if (result.retry || (uncertain.current && !result.definitive)) {
          uncertain.current = true;
          setRecovery(true);
          result = { ...result, retry: true };
        } else {
          try {
            sessionStorage.removeItem(`cash-submission:${context.staffId}`);
            submission.current = null;
            uncertain.current = false;
            setRecovery(false);
            if (recovery) setStep(member ? "entry" : "till");
          } catch {
            setStartupError(
              "Browser recovery storage could not be cleared. Restore it before recording another payment.",
            );
          }
        }
      }
      setRecordState(result);
    });

  const member = memberState?.ok ? memberState : undefined;
  if (!context && !startupError)
    return <p role="status">Loading cashier workspace...</p>;
  return (
    <div className="flex flex-col gap-5">
      {startupError ? (
        <Alert variant="destructive">
          <AlertTitle>Cash workspace unavailable</AlertTitle>
          <AlertDescription>{startupError}</AlertDescription>
        </Alert>
      ) : null}
      {!recovery && recordState?.ok === false && step !== "review" ? (
        <Alert variant="destructive">
          <AlertDescription>{recordState.message}</AlertDescription>
        </Alert>
      ) : null}
      {recovery ? (
        <Alert>
          <AlertTitle>Resolve the previous contribution</AlertTitle>
          <AlertDescription>
            The result is uncertain. Check for its receipt or retry the exact
            saved payment before collecting another contribution.
          </AlertDescription>
          {recordState?.ok === false ? (
            <p role="alert">{recordState.message}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={recording}
              onClick={() =>
                startRecording(async () => {
                  const key = String(
                    submission.current?.get("idempotencyKey") ?? "",
                  );
                  let result: CashMutationState;
                  try {
                    result = await recoverCashReceiptAction({
                      idempotencyKey: key,
                    });
                  } catch {
                    result = {
                      ok: false,
                      retry: true,
                      message: "Receipt lookup failed. Try again.",
                    };
                  }
                  setRecordState(result);
                  if (result?.ok) {
                    try {
                      sessionStorage.removeItem(
                        `cash-submission:${context?.staffId}`,
                      );
                    } catch {
                      setStartupError(
                        "Receipt recovered but browser storage could not be cleared.",
                      );
                    }
                    submission.current = null;
                    uncertain.current = false;
                    setRecovery(false);
                    setStep("receipt");
                  }
                })
              }
            >
              Check receipt
            </Button>
            <Button
              disabled={recording || Boolean(startupError)}
              variant="outline"
              onClick={() => recordAction(new FormData())}
            >
              Retry same contribution
            </Button>
          </div>
        </Alert>
      ) : !startupError && context?.canRecord ? (
        <>
          <ContributionProgress step={step} />
          {step === "till" ? (
            <OpenTillStep
              action={openAction}
              pending={opening}
              state={openState}
            />
          ) : null}
          {step === "member" && session?.status === "open" ? (
            <MemberLookupStep
              action={findAction}
              onCloseTill={() => setStep("close")}
              pending={finding}
              state={memberState?.ok ? null : memberState}
            />
          ) : null}
          {step === "entry" && member ? (
            <ContributionEntryStep
              amounts={amounts}
              initialPeriod={draft?.contributionPeriod}
              key={member.member.id}
              memberState={member}
              onBack={() => setStep("member")}
              onReview={(value) => {
                setDraft(value);
                setRecordState(null);
                setStep("review");
              }}
              setAmounts={setAmounts}
            />
          ) : null}
          {step === "review" &&
          member &&
          draft &&
          session?.status === "open" ? (
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
          {step === "close" && session ? (
            <CloseTillStep
              action={closeAction}
              onBack={() => setStep("member")}
              pending={closing}
              sessionId={session.id}
              state={closeState}
            />
          ) : null}
          {step === "close" && session?.status === "closed" ? (
            <Button
              onClick={() => {
                setSession(undefined);
                setStep("till");
              }}
            >
              Open a new till
            </Button>
          ) : null}
        </>
      ) : null}
      {!recovery && step === "receipt" && recordState?.ok ? (
        <ReceiptStep
          memberState={member}
          onAnotherMember={() => {
            setRecordState(null);
            setDraft(null);
            setAmounts(emptyAmounts());
            setStep(session?.status === "open" ? "member" : "till");
          }}
          onCloseTill={() => setStep(session ? "close" : "till")}
          state={recordState}
        />
      ) : null}
      {!recovery && context?.canRecord && !startupError && step === "till" ? (
        <form
          action={(data) =>
            startRecording(async () => {
              const result = await recoverCashReceiptAction({
                receiptId: String(data.get("receiptId")),
              });
              setRecordState(result);
              if (result?.ok) setStep("receipt");
            })
          }
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="receiptId">
                Reopen a receipt by ID
              </FieldLabel>
              <Input id="receiptId" name="receiptId" required />
            </Field>
            <Button disabled={recording}>Load receipt</Button>
          </FieldGroup>
          {recordState?.ok === false ? (
            <p role="alert">{recordState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
