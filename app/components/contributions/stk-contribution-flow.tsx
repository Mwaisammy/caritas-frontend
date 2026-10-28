"use client";
import { LoanContributionBreakdown } from "./loan-contribution-breakdown";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { CashContext, ContributionPaymentRequest } from "@/lib/go-api-client";
import {
  checkSTKContributionAction, findCashMemberAction, initiateSTKContributionAction,
  loadCashWorkspaceAction, type CashMemberState, type STKState,
} from "@/app/dashboard/contributions/actions";
import { ContributionEntryStep } from "./contribution-entry-step";
import { MemberLookupStep } from "./member-lookup-step";
import { allocationLabel, emptyAmounts, formatDecimalMoney, formatMoney, type ContributionDraft } from "./contribution-utils";
import { toast } from "@/components/ui/toast";

// STKContributionFlow reuses member lookup and allocation entry, while retaining
// one submitted snapshot until its payment and receipt outcomes are known.
export function STKContributionFlow({ onLockChange }: { onLockChange: (locked: boolean) => void }) {
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
  const [request, setRequest] = useState<ContributionPaymentRequest | null>(null);
  const [pending, startPayment] = useTransition();

  // Polling reads the saved request only; removing it leaves users waiting on a stale screen.
  useEffect(() => {
    if (!saved || request?.receipt?.status === "completed") return;
    let active = true;
    const timer = setInterval(async () => {
      if (!submission.current || checking.current || pending) return;
      checking.current = true;
      try {
        const result = await checkSTKContributionAction(String(submission.current.get("idempotencyKey")));
        if (active && result?.ok) { setRequest(result.request); setState(result); }
      } catch {
        if (active) setState({ ok: false, message: "Unable to check status. The saved request is retained." });
      } finally {
        checking.current = false;
      }
    }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [saved, request?.receipt?.status, pending]);

  useEffect(() => {
    let active = true;
    loadCashWorkspaceAction().then(async (result) => {
      if (!active) return;
      if (!result.ok) { setStartupError(result.message); return; }
      setContext(result.context);
      try {
        const stored = sessionStorage.getItem(`stk-submission:${result.context.staffId}`);
        if (!stored) return;
        const values = z.array(z.tuple([z.string(), z.string()])).parse(JSON.parse(stored));
        const data = new FormData();
        for (const [key, value] of values) data.set(key, value);
        submission.current = data;
        setDraft({ amount: String(data.get("amount") ?? "0"), contributionPeriod: String(data.get("contributionPeriod") ?? ""), allocations: [] });
        setPhone(String(data.get("phoneNumber") ?? ""));
        setSaved(true);
        const recovered = await checkSTKContributionAction(String(data.get("idempotencyKey")));
        if (!active || submission.current !== data) return;
        setState(recovered);
        if (recovered?.ok) setRequest(recovered.request);
      } catch {
        if (active) setStartupError("Saved payment could not be recovered. Reload and check browser storage before starting another payment.");
      }
    }).catch(() => {
      if (active) setStartupError("The contribution workspace could not load. Reload to try again.");
    });
    return () => { active = false; };
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
    }, null,
  );
  const member = memberState?.ok ? memberState : null;

  // Persist before posting: refreshes and uncertain retries must reuse this exact snapshot.
  const sendPrompt = () => startPayment(async () => {
    if (!context) return;
    const retrying = Boolean(submission.current);
    if (!submission.current) {
      if (!draft || !member) return;
      const normalized = phone.trim().replace(/[ -]/g, "").replace(/^\+/, "");
      if (!/^(?:254|0)?[17]\d{8}$/.test(normalized)) {
        setPhoneError("Enter a valid Kenyan mobile number, such as 0712345678.");
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
        sessionStorage.setItem(`stk-submission:${context.staffId}`, JSON.stringify(Array.from(data.entries())));
      } catch {
        setState({ ok: false, message: "Enable browser storage before sending a payment request." });
        toast.add({
          title: "M-Pesa prompt not sent",
          description: "Enable browser storage before sending the payment request.",
          type: "error",
        });
        return;
      }
      submission.current = data;
      setPhone(normalized);
      setSaved(true);
    }
    try {
      const result = await initiateSTKContributionAction(submission.current);
      setState(result);
      if (result?.ok) {
        setRequest(result.request);
        toast.add({
          title: retrying ? "Saved M-Pesa request found" : "M-Pesa prompt sent",
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
          title: result.definitive ? "M-Pesa prompt not sent" : "M-Pesa prompt needs confirmation",
          description: result.definitive
            ? "Check the phone number and contribution details, then try again."
            : "We couldn't confirm whether the prompt was sent. Check status or retry this saved request; don't start another payment.",
          type: result.definitive ? "error" : "warning",
        });
      }
    } catch {
      setState({ ok: false, message: "The result is unconfirmed. Check status before starting another payment." });
      toast.add({
        title: "M-Pesa prompt needs confirmation",
        description: "We couldn't confirm whether the prompt was sent. Check status or retry this saved request; don't start another payment.",
        type: "warning",
      });
    }
  });

  // Checking state never calls initiation or clears an uncertain request.
  const checkStatus = () => startPayment(async () => {
    if (!submission.current || checking.current) return;
    checking.current = true;
    try {
      const result = await checkSTKContributionAction(String(submission.current.get("idempotencyKey")), true);
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
          current.receipt?.status === "failed" ||
          current.receipt?.status === "manual_review"
        ) {
          toast.add({
            title: "Payment received; review needed",
            description: "Staff must reconcile the contribution before another payment is requested.",
            type: "warning",
          });
        } else if (
          current.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_FAILED" &&
          !current.receipt
        ) {
          toast.add({
            title: "M-Pesa payment not completed",
            description: "Confirm whether money was deducted before retrying the saved request.",
            type: "error",
          });
        } else {
          toast.add({
            title: "Payment still awaiting confirmation",
            description: "Check the phone receiving the prompt, then check the status again shortly.",
            type: "info",
          });
        }
      } else if (result) {
        toast.add({
          title: "Payment status unavailable",
          description: "We couldn't confirm the payment yet. The saved request is retained; check again shortly.",
          type: "warning",
        });
      }
    } catch {
      setState({ ok: false, message: "Unable to check status. Try again; the saved request is retained." });
      toast.add({
        title: "Payment status unavailable",
        description: "We couldn't confirm the payment yet. The saved request is retained; check again shortly.",
        type: "warning",
      });
    }
  });

  const receipt = request?.receipt;
  const completed = receipt?.status === "completed";
  const failed = request?.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_FAILED" && !receipt;
  const needsReview = receipt?.status === "failed" || receipt?.status === "manual_review";
  const finished = completed || failed || needsReview;
  const title = completed ? "Contribution completed"
    : request?.recoveryStatus === "not_sent" ? "Payment prompt was not sent"
    : request?.recoveryStatus === "received_needs_receipt" ? "M-Pesa confirms payment. Receipt needs reconciliation"
    : needsReview ? "Payment received. Contribution needs review"
    : receipt ? "Payment received. Processing contribution"
    : failed ? "Payment request unsuccessful"
    : request?.status === "CONTRIBUTION_PAYMENT_REQUEST_STATUS_PENDING" ? "Awaiting payment confirmation"
    : "Payment status unconfirmed";

  // Clear browser recovery state so finishing or discarding starts a new request without altering payment records.
  const returnToMemberSearch = () => {
    if (!context) return;
    try { sessionStorage.removeItem(`stk-submission:${context.staffId}`); }
    catch { setState({ ok: false, message: "Browser recovery storage could not be cleared. Restore storage before another payment." }); return; }
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

  if (startupError) return <Alert variant="destructive"><AlertTitle>M-Pesa workspace unavailable</AlertTitle><AlertDescription>{startupError}</AlertDescription></Alert>;
  if (!context) return <Alert><Spinner /><AlertTitle>Loading M-Pesa workspace</AlertTitle><AlertDescription>Checking staff access and saved requests.</AlertDescription></Alert>;
  if (!context.canRecord) return <Alert><AlertTitle>M-Pesa collection unavailable</AlertTitle><AlertDescription>You do not have permission to request payments.</AlertDescription></Alert>;

  if (saved) return (
    <Card className="mx-auto w-full max-w-2xl" aria-busy={pending}>
      <CardHeader>
        <CardTitle>M-Pesa contribution</CardTitle>
        <CardDescription>Check the stored payment outcome. Checking status does not send another prompt.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div aria-live="polite">
          <Alert variant={failed || needsReview ? "destructive" : "default"}>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{completed ? "The receipt and all required allocations completed."
              : needsReview ? "Contact staff to reconcile the received money before requesting payment again."
              : failed ? request?.failureReason || "Check whether money was deducted before starting another payment."
              : receipt ? "The backend is applying the received money to the contribution. Check again for the final outcome."
              : request?.recoveryStatus === "received_needs_receipt" ? "Staff must verify the receipt against business records. Do not send another payment."
              : request?.recoveryStatus === "not_sent" ? "Retry the same saved request to send the prompt. No STK request was sent for this attempt."
              : "Complete the M-Pesa prompt on the phone, then check status. A delay does not mean the payment failed."}</AlertDescription>
          </Alert>
        </div>
        <Badge variant="secondary">{title}</Badge>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt>Amount</dt><dd>{request?.amount ? formatMoney(request.amount) : formatDecimalMoney(draft?.amount ?? "0")}</dd></div>
          <div><dt>Contribution month</dt><dd>{request?.contributionPeriod?.slice(0, 7) || draft?.contributionPeriod}</dd></div>
          <div><dt>Phone receiving prompt</dt><dd>{phone}</dd></div>
          {request?.createdAt ? <div><dt>Requested at</dt><dd>{new Date(request.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</dd></div> : null}
          {request?.paymentRequestId ? <div className="sm:col-span-2"><dt>Payment request reference</dt><dd className="break-all">{request.paymentRequestId}</dd></div> : null}
        </dl>
        {receipt ? <>
          <Separator />
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt>Received amount</dt><dd>{formatMoney(receipt.amount)}</dd></div>
            <div><dt>M-Pesa reference</dt><dd>{receipt.mpesaReference || "Not available"}</dd></div>
            <div><dt>Receipt status</dt><dd>{receipt.status.replaceAll("_", " ")}</dd></div>
            {receipt.receivedAt ? <div><dt>Received at</dt><dd>{new Date(receipt.receivedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</dd></div> : null}
            <div className="sm:col-span-2"><dt>Receipt reference</dt><dd className="break-all">{receipt.id}</dd></div>
          </dl>
          <LoanContributionBreakdown posted pending={!completed} loans={receipt.loans} snapshotAvailable={receipt.loanSnapshotAvailable} />
        </> : null}
        {state?.ok === false ? <Alert variant="destructive"><AlertTitle>Status unavailable</AlertTitle><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button disabled={pending} onClick={checkStatus}>{pending ? <Spinner data-icon="inline-start" /> : null}Check status</Button>
        {!request || request.recoveryStatus === "not_sent" ? <Button disabled={pending} onClick={sendPrompt} variant="outline">Retry same saved request</Button> : null}
        {finished ? <Button disabled={pending} variant="outline" onClick={returnToMemberSearch}>Finish and return to member search</Button> : (
          <AlertDialog>
            <AlertDialogTrigger render={<Button disabled={pending} variant="outline" />}>Discard and start over</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this saved payment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears the saved payment from this browser and returns to member search. The original payment is not cancelled and may still complete. Check whether money was deducted before sending another prompt; a new attempt could charge again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep checking payment</AlertDialogCancel>
                <AlertDialogAction disabled={pending} onClick={returnToMemberSearch}>Discard and start over</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );

  if (draft && member) return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader><CardTitle>Review M-Pesa contribution</CardTitle><CardDescription>Confirm the phone and complete allocation before sending the prompt.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>{member.member.profile?.personal?.fullName ?? "Unnamed member"} · Member {member.member.memberNumber}</p>
        <p>Contribution month: {draft.contributionPeriod}</p>
        <dl className="flex flex-col gap-2">
          {draft.allocations.map((item) => <div className="flex justify-between gap-3" key={`${item.type}-${item.targetId ?? "fee"}`}><dt>{allocationLabel(item.type)}</dt><dd>{formatDecimalMoney(item.amount)}</dd></div>)}
        </dl>
        <Separator />
        <LoanContributionBreakdown loans={draft.loans} allocations={draft.allocations} />
        <form onSubmit={(event) => { event.preventDefault(); sendPrompt(); }}>
          <FieldGroup>
            <Field data-invalid={Boolean(phoneError)}>
              <FieldLabel htmlFor="stk-phone">Phone receiving the M-Pesa prompt</FieldLabel>
              <Input id="stk-phone" type="tel" autoComplete="tel" required disabled={pending} value={phone} aria-invalid={Boolean(phoneError)} onChange={(event) => { setPhone(event.target.value); setPhoneError(""); }} />
              <FieldDescription>Use 07…, 01…, or +254…. The payer enters their M-Pesa PIN on their phone.</FieldDescription>
              <FieldError>{phoneError}</FieldError>
            </Field>
            {state?.ok === false ? <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert> : null}
            <Button disabled={pending} type="submit">{pending ? <Spinner data-icon="inline-start" /> : null}Send M-Pesa prompt · {formatDecimalMoney(draft.amount)}</Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter><Button disabled={pending} variant="ghost" onClick={() => { setDraft(null); setState(null); }}>Edit contribution</Button></CardFooter>
    </Card>
  );

  if (editing && member) return <ContributionEntryStep paymentMethod="mpesa" amounts={amounts} memberState={member} setAmounts={setAmounts} onBack={() => setEditing(false)} onReview={(value) => { setDraft(value); setState(null); }} />;
  return <MemberLookupStep action={findAction} pending={finding} state={memberState} />;
}
