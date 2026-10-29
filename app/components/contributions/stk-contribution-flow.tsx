"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type {
  CashContext,
  ContributionPaymentRequest,
} from "@/lib/go-api-client";
import {
  checkSTKContributionAction,
  findCashMemberAction,
  initiateSTKContributionAction,
  loadCashWorkspaceAction,
  type CashMemberState,
  type STKState,
} from "@/app/dashboard/contributions/actions";
import { ContributionEntryStep } from "./contribution-entry-step";
import { MemberLookupStep } from "./member-lookup-step";
import {
  allocationLabel,
  emptyAmounts,
  formatDecimalMoney,
  formatMoney,
  type ContributionDraft,
} from "./contribution-utils";
import { toast } from "@/components/ui/toast";
import { STKProgress } from "./stk-progress";
import { STKPaymentStatus } from "./stk-payment-status";
import { STKReceipt } from "./stk-receipt";
import { LoanContributionBreakdown } from "./loan-contribution-breakdown";

// STKContributionFlow reuses member lookup and allocation entry, while retaining
// one submitted snapshot until its payment and receipt outcomes are known.
export function STKContributionFlow({
  onLockChange,
}: {
  onLockChange: (locked: boolean) => void;
}) {
  const submission = useRef<FormData | null>(null);
  const checking = useRef(false);
  const [context, setContext] = useState<CashContext | null>(null);
  const [startupError, setStartupError] = useState("");
  const [saved, setSaved] = useState(false);
  const [amounts, setAmounts] = useState(emptyAmounts());
  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<STKState>(null);
  const [request, setRequest] = useState<ContributionPaymentRequest | null>(
    null,
  );
  const [pending, startPayment] = useTransition();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const pollInFlight = useRef(false);
  const submissionInFlight = useRef(false);
  const receiptStatus = request?.receipt?.status;
  const reviewRequired =
    request?.recoveryStatus === "received_needs_receipt" ||
    request?.recoveryStatus === "received_needs_review" ||
    request?.recoveryStatus === "needs_review" ||
    receiptStatus === "failed" ||
    receiptStatus === "manual_review";
  const terminal =
    receiptStatus === "completed" ||
    reviewRequired ||
    request?.recoveryStatus === "provider_failed" ||
    (request?.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_FAILED" &&
      !request.receipt);

  // Polling reads the saved request only; removing it leaves users waiting on a stale screen.
  useEffect(() => {
    if (!saved || terminal) return;
    let active = true;
    const timer = setInterval(async () => {
      if (
        !submission.current ||
        pollInFlight.current ||
        submissionInFlight.current
      ) return;
      pollInFlight.current = true;
      setCheckingStatus(true);
      const savedSubmission = submission.current;
      try {
        const result = await checkSTKContributionAction(
          String(savedSubmission.get("idempotencyKey")),
        );
        if (active && submission.current === savedSubmission && result?.ok) {
          setRequest(result.request);
          setState(result);
          if (result.request.receipt?.status === "completed") {
            toast.add({
              title: "Contribution completed",
              description: "Payment and required allocations are complete.",
              type: "success",
            });
          } else if (
            result.request.recoveryStatus === "received_needs_receipt" ||
            result.request.recoveryStatus === "received_needs_review" ||
            result.request.recoveryStatus === "needs_review" ||
            result.request.receipt?.status === "failed" ||
            result.request.receipt?.status === "manual_review"
          ) {
            toast.add({
              title: "Payment needs staff review",
              description:
                "The saved payment requires reconciliation before another request.",
              type: "warning",
            });
          } else if (
            result.request.recoveryStatus === "provider_failed" ||
            (result.request.status ===
              "CONTRIBUTION_PAYMENT_REQUEST_STATUS_FAILED" &&
              !result.request.receipt)
          ) {
            toast.add({
              title: "M-Pesa payment not completed",
              description:
                "Confirm whether money was deducted before retrying the saved request.",
              type: "error",
            });
          }
        } else if (active && submission.current === savedSubmission && result) {
          setState(result);
        }
      } catch {
        if (active && submission.current === savedSubmission) {
          setState({
            ok: false,
            message: "Unable to check status. The saved request is retained.",
          });
        }
      } finally {
        pollInFlight.current = false;
        if (active) setCheckingStatus(false);
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [saved, terminal]);

  useEffect(() => {
    let active = true;
    loadCashWorkspaceAction()
      .then(async (result) => {
        if (!active) return;
        if (!result.ok) {
          setStartupError(result.message);
          return;
        }
        setContext(result.context);
        try {
          const stored = sessionStorage.getItem(
            `stk-submission:${result.context.staffId}`,
          );
          if (!stored) return;
          const values = z
            .array(z.tuple([z.string(), z.string()]))
            .parse(JSON.parse(stored));
          const data = new FormData();
          for (const [key, value] of values) data.set(key, value);
          submission.current = data;
          setDraft({
            amount: String(data.get("amount") ?? "0"),
            contributionPeriod: String(data.get("contributionPeriod") ?? ""),
            allocations: [],
          });
          setPhone(String(data.get("phoneNumber") ?? ""));
          setSaved(true);
          pollInFlight.current = true;
          setCheckingStatus(true);
          let recovered: STKState;
          try {
            recovered = await checkSTKContributionAction(
              String(data.get("idempotencyKey")),
            );
          } finally {
            pollInFlight.current = false;
            if (active) setCheckingStatus(false);
          }
          if (!active || submission.current !== data) return;
          setState(recovered);
          if (recovered?.ok) setRequest(recovered.request);
        } catch {
          if (active)
            setStartupError(
              "Saved payment could not be recovered. Reload and check browser storage before starting another payment.",
            );
        }
      })
      .catch(() => {
        if (active)
          setStartupError(
            "The contribution workspace could not load. Reload to try again.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onLockChange(saved || pending || Boolean(draft) || Boolean(startupError));
  }, [saved, pending, draft, startupError, onLockChange]);

  const [memberState, findAction, finding] = useActionState(
    async (previous: CashMemberState, data: FormData) => {
      const result = await findCashMemberAction(previous, data);
      if (result?.ok) {
        setAmounts(emptyAmounts(result.loans));
        setPhone(result.member.profile?.personal?.phone ?? "");
        setPhoneError("");
        setDraft(null);
        setEditing(true);
        setState(null);
      }
      return result;
    },
    null,
  );
  const member = memberState?.ok ? memberState : null;

  // Persist before posting: refreshes and uncertain retries must reuse this exact snapshot.
  const sendPrompt = () =>
    startPayment(async () => {
      if (pollInFlight.current) return;
      if (!context) return;
      const retrying = Boolean(submission.current);
      if (!submission.current) {
        if (!draft || !member) return;
        const normalized = phone.trim().replace(/[ -]/g, "").replace(/^\+/, "");
        if (!/^(?:254|0)?[17]\d{8}$/.test(normalized)) {
          setPhoneError(
            "Enter a valid Kenyan mobile number, such as 0712345678.",
          );
          return;
        }
        const data = new FormData();
        data.set("idempotencyKey", crypto.randomUUID());
        data.set("memberId", member.member.id);
        data.set("phoneNumber", normalized);
        data.set("contributionPeriod", draft.contributionPeriod);
        data.set("amount", draft.amount);
        data.set("allocations", JSON.stringify(draft.allocations));
        try {
          sessionStorage.setItem(
            `stk-submission:${context.staffId}`,
            JSON.stringify(Array.from(data.entries())),
          );
        } catch {
          setState({
            ok: false,
            message: "Enable browser storage before sending a payment request.",
          });
          toast.add({
            title: "M-Pesa prompt not sent",
            description:
              "Enable browser storage before sending the payment request.",
            type: "error",
          });
          return;
        }
        submission.current = data;
        setPhone(normalized);
        setSaved(true);
      }
      submissionInFlight.current = true;
      try {
        const result = await initiateSTKContributionAction(submission.current);
        setState(result);
        if (result?.ok) {
          setRequest(result.request);
          toast.add({
            title: retrying
              ? "Saved M-Pesa request found"
              : "M-Pesa prompt sent",
            description: retrying
              ? "The saved request was not sent again. Check its status before starting another payment."
              : "Ask the member to enter their PIN on the phone receiving the prompt.",
            type: "info",
          });
        } else if (result?.definitive && !retrying) {
          sessionStorage.removeItem(`stk-submission:${context.staffId}`);
          submission.current = null;
          setSaved(false);
        }
        if (result && !result.ok) {
          toast.add({
            title: result.definitive
              ? "M-Pesa prompt not sent"
              : "M-Pesa prompt needs confirmation",
            description: result.definitive
              ? "Check the phone number and contribution details, then try again."
              : "We couldn't confirm whether the prompt was sent. Check status or retry this saved request; don't start another payment.",
            type: result.definitive ? "error" : "warning",
          });
        }
      } catch {
        setState({
          ok: false,
          message:
            "The result is unconfirmed. Check status before starting another payment.",
        });
        toast.add({
          title: "M-Pesa prompt needs confirmation",
          description:
            "We couldn't confirm whether the prompt was sent. Check status or retry this saved request; don't start another payment.",
          type: "warning",
        });
      } finally {
        submissionInFlight.current = false;
      }
    });

  // Checking state never calls initiation or clears an uncertain request.
  const checkStatus = () =>
    startPayment(async () => {
      if (
        !submission.current ||
        pollInFlight.current ||
        submissionInFlight.current
      ) return;
      pollInFlight.current = true;
      setCheckingStatus(true);
      const savedSubmission = submission.current;
      try {
        const result = await checkSTKContributionAction(
          String(savedSubmission.get("idempotencyKey")),
          true,
        );
        if (submission.current !== savedSubmission) return;
        setState(result);
        if (result?.ok) {
          const current = result.request;
          setRequest(current);
          if (current.receipt?.status === "completed") {
            toast.add({
              title: "Contribution completed",
              description: "Payment and required allocations are complete.",
              type: "success",
            });
          } else if (
            current.recoveryStatus === "received_needs_receipt" ||
            current.recoveryStatus === "received_needs_review" ||
            current.recoveryStatus === "needs_review" ||
            current.receipt?.status === "failed" ||
            current.receipt?.status === "manual_review"
          ) {
            toast.add({
              title: "Payment received; review needed",
              description:
                "Staff must reconcile the contribution before another payment is requested.",
              type: "warning",
            });
          } else if (
            current.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_FAILED" &&
            !current.receipt
          ) {
            toast.add({
              title: "M-Pesa payment not completed",
              description:
                "Confirm whether money was deducted before retrying the saved request.",
              type: "error",
            });
          } else {
            toast.add({
              title: "Payment still awaiting confirmation",
              description:
                "Check the phone receiving the prompt, then check the status again shortly.",
              type: "info",
            });
          }
        } else if (result) {
          toast.add({
            title: "Payment status unavailable",
            description:
              "We couldn't confirm the payment yet. The saved request is retained; check again shortly.",
            type: "warning",
          });
        }
      } catch {
        if (submission.current !== savedSubmission) return;
        setState({
          ok: false,
          message:
            "Unable to check status. Try again; the saved request is retained.",
        });
        toast.add({
          title: "Payment status unavailable",
          description:
            "We couldn't confirm the payment yet. The saved request is retained; check again shortly.",
          type: "warning",
        });
      } finally {
        pollInFlight.current = false;
        setCheckingStatus(false);
      }
    });

  const receipt = request?.receipt;
  const completed = receipt?.status === "completed";
  const failed =
    request?.recoveryStatus === "provider_failed" ||
    (request?.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_FAILED" &&
      !receipt);
  const needsReview = reviewRequired;
  const paymentReceivedNeedsReview =
    request?.recoveryStatus === "received_needs_receipt" ||
    request?.recoveryStatus === "received_needs_review" ||
    Boolean(receipt);
  const finished = terminal;
  const paymentStatus = completed
    ? "completed"
    : needsReview
      ? "review"
      : failed
        ? "failed"
        : receipt
          ? "processing"
          : pending && !request
            ? "sending"
            : pending || checkingStatus
              ? "verifying"
              : state?.ok === false
                ? "unconfirmed"
                : request?.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_PENDING"
                  ? "awaiting"
                  : "unconfirmed";
  const title = completed
    ? "Contribution completed"
    : needsReview
      ? paymentReceivedNeedsReview
        ? "Payment received. Contribution needs review"
        : "Payment status needs staff review"
      : failed
        ? "Payment request unsuccessful"
        : receipt
          ? "Payment received. Processing contribution"
          : state?.ok === false
            ? "Payment status unconfirmed"
            : request?.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_PENDING"
              ? "Awaiting payment confirmation"
              : checkingStatus
                ? "Checking saved payment"
                : "Payment request status unavailable";

  // StageProgress keeps M-Pesa steps clear without changing the shared cash flow screens.
  const stageProgress = (
    step: 1 | 2 | 3 | 4,
    label: string,
    detail: string,
    progressState: "active" | "completed" | "failed" | "review" = "active",
  ) => (
    <STKProgress
      step={step}
      state={progressState}
      label={label}
      detail={detail}
    />
  );

  // Clear browser recovery state so finishing or discarding starts a new request without altering payment records.
  const returnToMemberSearch = () => {
    if (!context) return;
    try {
      sessionStorage.removeItem(`stk-submission:${context.staffId}`);
    } catch {
      setState({
        ok: false,
        message:
          "Browser recovery storage could not be cleared. Restore storage before another payment.",
      });
      return;
    }
    submission.current = null;
    setSaved(false);
    setRequest(null);
    setState(null);
    setDraft(null);
    setEditing(false);
    setAmounts(emptyAmounts());
    setPhone("");
    setPhoneError("");
  };

  if (startupError)
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {stageProgress(1, "Find member", "Start by locating the member.")}
        <Alert variant="destructive">
          <AlertTitle>M-Pesa workspace unavailable</AlertTitle>
          <AlertDescription>{startupError}</AlertDescription>
        </Alert>
      </div>
    );
  if (!context)
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {stageProgress(
          1,
          "Find member",
          "Checking staff access and saved payment requests.",
        )}
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Spinner />
            <div>
              <p className="font-medium">Opening M-Pesa workspace</p>
              <p className="text-sm text-muted-foreground">
                Checking staff access and saved payment requests.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  if (!context.canRecord)
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {stageProgress(
          1,
          "Find member",
          "Staff access is required to collect a contribution.",
        )}
        <Alert>
          <AlertTitle>M-Pesa collection unavailable</AlertTitle>
          <AlertDescription>
            You do not have permission to request payments.
          </AlertDescription>
        </Alert>
      </div>
    );

  if (saved)
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {stageProgress(
          receipt ? 4 : 3,
          receipt ? "Contribution status" : "Confirm payment",
          completed
            ? "Payment and allocations are complete."
            : needsReview
              ? "Payment needs staff reconciliation."
              : failed
                ? "The payment request failed."
                : "The saved request is checked for confirmation.",
          completed
            ? "completed"
            : needsReview
              ? "review"
              : failed
                ? "failed"
                : "active",
        )}
        <Card className="mx-auto w-full max-w-2xl" aria-busy={pending}>
          <CardHeader>
            <CardTitle>M-Pesa contribution</CardTitle>
            <CardDescription>
              Check the stored payment outcome. Checking status does not send
              another prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <STKPaymentStatus
              title={title}
              description={
                completed
                  ? "The receipt and every required allocation are complete."
                  : needsReview
                    ? paymentReceivedNeedsReview
                      ? "Staff must reconcile the received payment before another request is made."
                      : "Staff must verify this payment status before another request is made."
                    : failed
                      ? "Check whether money was deducted before trying again."
                      : receipt
                        ? "Payment is received. The contribution receipt is still processing."
                        : paymentStatus === "sending"
                          ? "Sending the saved M-Pesa request."
                          : paymentStatus === "verifying"
                            ? "Checking the saved request with M-Pesa."
                            : paymentStatus === "awaiting"
                              ? "The prompt was accepted. Ask the payer to enter their PIN on the receiving phone."
                              : "We couldn't confirm the current status. The saved request is retained; check again shortly."
              }
              status={paymentStatus}
              checking={pending || checkingStatus}
            />
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt>Amount</dt>
                <dd>
                  {request?.amount
                    ? formatMoney(request.amount)
                    : formatDecimalMoney(draft?.amount ?? "0")}
                </dd>
              </div>
              <div>
                <dt>Contribution month</dt>
                <dd>
                  {request?.contributionPeriod?.slice(0, 7) ||
                    draft?.contributionPeriod}
                </dd>
              </div>
              <div>
                <dt>Phone receiving prompt</dt>
                <dd>{phone}</dd>
              </div>
              {request?.createdAt ? (
                <div>
                  <dt>Requested at</dt>
                  <dd>
                    {new Date(request.createdAt).toLocaleString("en-KE", {
                      timeZone: "Africa/Nairobi",
                    })}
                  </dd>
                </div>
              ) : null}
            </dl>
            {receipt ? (
              <STKReceipt
                receipt={receipt}
                member={member}
                period={request?.contributionPeriod?.slice(0, 7) || draft?.contributionPeriod || ""}
                phone={phone}
                completed={completed}
              />
            ) : null}
            {state?.ok === false ? (
              <Alert variant="destructive">
                <AlertTitle>Status unavailable</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button disabled={pending || checkingStatus || completed || needsReview} onClick={checkStatus}>
              {pending || checkingStatus ? <Spinner data-icon="inline-start" /> : null}
              {pending || checkingStatus ? "Checking status…" : "Check status"}
            </Button>
            {!request ? (
              <Button disabled={pending || checkingStatus} onClick={sendPrompt} variant="outline">
                Retry same saved request
              </Button>
            ) : null}
            {finished ? (
              <Button
                disabled={pending}
                variant="outline"
                onClick={returnToMemberSearch}
              >
                Finish and return to member search
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button disabled={pending} variant="outline" />}
                >
                  Discard and start over
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Discard this saved payment?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This clears the saved payment from this browser and
                      returns to member search. The original payment is not
                      cancelled and may still complete. Check whether money was
                      deducted before sending another prompt; a new attempt
                      could charge again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep checking payment</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={pending}
                      onClick={returnToMemberSearch}
                    >
                      Discard and start over
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        </Card>
      </div>
    );

  if (draft && member)
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {stageProgress(
          2,
          "Review contribution",
          "Review the member, allocation, amount and phone before sending the prompt.",
        )}
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Review M-Pesa contribution</CardTitle>
            <CardDescription>
              Confirm the phone and complete allocation before sending the
              prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>
              {member.member.profile?.personal?.fullName ?? "Unnamed member"} ·
              Member {member.member.memberNumber}
            </p>
            <p>Contribution month: {draft.contributionPeriod}</p>
            <dl className="flex flex-col gap-2">
              {draft.allocations.map((item) => (
                <div
                  className="flex justify-between gap-3"
                  key={`${item.type}-${item.targetId ?? "fee"}`}
                >
                  <dt>{allocationLabel(item.type)}</dt>
                  <dd>{formatDecimalMoney(item.amount)}</dd>
                </div>
              ))}
            </dl>
            <Separator />
            <LoanContributionBreakdown
              loans={draft.loans}
              allocations={draft.allocations}
            />
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendPrompt();
              }}
            >
              <FieldGroup>
                <Field data-invalid={Boolean(phoneError)}>
                  <FieldLabel htmlFor="stk-phone">
                    Phone receiving the M-Pesa prompt
                  </FieldLabel>
                  <Input
                    id="stk-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    disabled={pending}
                    value={phone}
                    aria-invalid={Boolean(phoneError)}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setPhoneError("");
                    }}
                  />
                  <FieldDescription>
                    Use 07…, 01…, or +254…. The payer enters their M-Pesa PIN on
                    their phone.
                  </FieldDescription>
                  <FieldError>{phoneError}</FieldError>
                </Field>
                {state?.ok === false ? (
                  <Alert variant="destructive">
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                ) : null}
                <Button disabled={pending} type="submit">
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {pending
                    ? "Sending…"
                    : `Send payment request · ${formatDecimalMoney(draft.amount)}`}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              disabled={pending}
              variant="ghost"
              onClick={() => {
                setDraft(null);
                setState(null);
              }}
            >
              Edit contribution
            </Button>
          </CardFooter>
        </Card>
      </div>
    );

  if (editing && member)
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {stageProgress(
          2,
          "Review contribution",
          "Choose what this member is paying for.",
        )}
        <ContributionEntryStep
          paymentMethod="mpesa"
          amounts={amounts}
          memberState={member}
          setAmounts={setAmounts}
          onBack={() => setEditing(false)}
          onReview={(value) => {
            setDraft(value);
            setState(null);
          }}
        />
      </div>
    );
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {stageProgress(
        1,
        "Find member",
        "Search by member number or national ID.",
      )}
      <MemberLookupStep
        action={findAction}
        pending={finding}
        state={memberState}
      />
    </div>
  );
}
