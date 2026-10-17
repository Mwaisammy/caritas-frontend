"use client";

import { useRef, useState, useTransition } from "react";
import { z } from "zod";
import {
  loadCreditWorkspaceAction,
  manageCreditAction,
} from "@/app/dashboard/loans/credit-actions";
import type {
  CreditBalance as Credit,
  CreditOperation,
} from "@/lib/go-api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { formatLoanDate, formatLoanMoney } from "./loan-badges";

// CreditBalance exposes partial use and refund reservations beside their source credit.
// Without this workspace, the old withdrawal button offers an operation with no approval or settlement history.
export function CreditBalance({
  credits,
  loanId,
}: {
  credits: Credit[];
  loanId: string;
}) {
  const [selected, setSelected] = useState<Credit | null>(null);
  const [workspace, setWorkspace] = useState<Awaited<
    ReturnType<typeof loadCreditWorkspaceAction>
  > | null>(null);
  const [action, setAction] = useState("transfer_shares");
  const [review, setReview] = useState<CreditOperation | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const submission = useRef<FormData | null>(null);
  const [pending, start] = useTransition();

  // load restores the immutable instruction before another spend is allowed; removing it loses retry identity on refresh.
  const load = (credit: Credit, pageToken = "") =>
    start(async () => {
      setSelected(credit);
      const result = await loadCreditWorkspaceAction(
        loanId,
        credit.id,
        pageToken,
      );
      setWorkspace(result);
      if (!result.ok) return;
      try {
        const key = `credit-operation:${result.context.staffId}:${credit.id}`;
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const entries = z
            .array(z.tuple([z.string(), z.string()]))
            .parse(JSON.parse(stored));
          const data = new FormData();
          for (const [name, value] of entries) data.set(name, value);
          const completed = result.operations.find(
            (row) => row.id === data.get("operationId"),
          );
          if (completed) {
            sessionStorage.removeItem(key);
            submission.current = null;
            setSaved(false);
          } else {
            submission.current = data;
            setSaved(true);
          }
        } else {
          submission.current = null;
          setSaved(false);
        }
      } catch {
        setFeedback({
          ok: false,
          message:
            "Saved credit instruction could not be restored. Restore browser storage before spending credit.",
        });
        setSaved(true);
      }
    });

  // submit retains the exact operation after uncertain responses; without it retrying could spend twice.
  const submit = (data: FormData) =>
    start(async () => {
      if (!workspace?.ok || !selected) return;
      if (saved && !submission.current && !review) {
        setFeedback({
          ok: false,
          message: "Restore the saved instruction before retrying.",
        });
        return;
      }
      const key = `credit-operation:${workspace.context.staffId}:${selected.id}`;
      data.set("loanId", loanId);
      data.set("creditBalanceId", selected.id);
      if (!review && !submission.current) {
        data.set("operationId", crypto.randomUUID());
        try {
          sessionStorage.setItem(
            key,
            JSON.stringify(Array.from(data.entries())),
          );
        } catch {
          setFeedback({
            ok: false,
            message:
              "Enable browser storage before submitting credit instructions.",
          });
          return;
        }
        submission.current = data;
        setSaved(true);
      }
      const outcome = await manageCreditAction(
        review ? data : (submission.current ?? data),
      );
      setFeedback(outcome);
      if (outcome.ok) {
        if (!review) {
          sessionStorage.removeItem(key);
          submission.current = null;
          setSaved(false);
        }
        setReview(null);
        setAction("transfer_shares");
        setWorkspace(await loadCreditWorkspaceAction(loanId, selected.id));
      } else if ("definitive" in outcome && outcome.definitive && !review) {
        sessionStorage.removeItem(key);
        submission.current = null;
        setSaved(false);
      }
    });

  if (!credits.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Member credit</CardTitle>
        <CardDescription>
          Overpayments belong to the member. Use them only with a recorded
          instruction.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {credits.map((credit) => (
          <div
            key={credit.id}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p>{formatLoanMoney(credit.availableAmount)} available</p>
              <p className="text-sm text-muted-foreground">
                {formatLoanMoney(credit.amount)} original ·{" "}
                {formatLoanMoney(credit.reservedAmount)} reserved ·{" "}
                {formatLoanMoney(credit.usedAmount)} used · Created{" "}
                {formatLoanDate(credit.createdAt)}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFeedback(null);
                setWorkspace(null);
                setReview(null);
                load(credit);
              }}
            >
              Use credit and view history
            </Button>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Transfers into shares are share purchases. Refund requests reserve
          funds until reviewed and settled.
        </p>
      </CardFooter>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !pending) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Credit instructions and history</DialogTitle>
            <DialogDescription>
              Choose how to use the member’s available credit. Refunds require
              another officer’s approval; payouts are verified separately.
            </DialogDescription>
          </DialogHeader>
          {feedback ? (
            <Alert variant={feedback.ok ? "default" : "destructive"}>
              <AlertTitle>Credit update</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}
          {!workspace ? (
            <Spinner />
          ) : !workspace.ok ? (
            <Alert variant="destructive">
              <AlertTitle>Credit unavailable</AlertTitle>
              <AlertDescription>{workspace.message}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-5">
              <p>
                {formatLoanMoney(workspace.credit.availableAmount)} available ·{" "}
                {formatLoanMoney(workspace.credit.reservedAmount)} reserved
              </p>
              {saved ? (
                <Alert>
                  <AlertTitle>
                    Saved instruction awaiting confirmation
                  </AlertTitle>
                  <AlertDescription>
                    Refresh history first. Retrying uses the same saved details
                    and reference.
                  </AlertDescription>
                  <Button
                    disabled={pending}
                    variant="outline"
                    onClick={() => submit(new FormData())}
                  >
                    Retry saved instruction
                  </Button>
                </Alert>
              ) : null}
              {!saved && (workspace.context.canRecord || review) ? (
                <form
                  action={submit}
                  key={`${selected?.id}-${review?.id ?? action}`}
                >
                  <FieldGroup>
                    {review ? (
                      <>
                        <input
                          type="hidden"
                          name="operationId"
                          value={review.id}
                        />
                        <input type="hidden" name="action" value={action} />
                        <p>
                          {action.replaceAll("_", " ")} ·{" "}
                          {formatLoanMoney(review.amount)}
                        </p>
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="action" value={action} />
                        <Field>
                          <FieldLabel>Use credit for</FieldLabel>
                          <ToggleGroup
                            value={[action]}
                            variant="outline"
                            onValueChange={(values) => {
                              if (values[0]) setAction(values[0]);
                            }}
                          >
                            <ToggleGroupItem value="transfer_shares">
                              Shares
                            </ToggleGroupItem>
                            <ToggleGroupItem value="apply_loan">
                              Loan payment
                            </ToggleGroupItem>
                            <ToggleGroupItem value="request_refund">
                              Refund request
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="credit-amount">
                            Amount (KES)
                          </FieldLabel>
                          <Input
                            id="credit-amount"
                            name="amount"
                            inputMode="decimal"
                            required
                          />
                        </Field>
                        {action === "apply_loan" ? (
                          <>
                            <Field>
                              <FieldLabel htmlFor="credit-target">
                                Destination loan
                              </FieldLabel>
                              <Input
                                id="credit-target"
                                name="targetId"
                                list="credit-loans"
                                required
                              />
                              <datalist id="credit-loans">
                                {workspace.loans.map((loan) => (
                                  <option key={loan.id} value={loan.id}>
                                    {formatLoanMoney(loan.principal)} ·{" "}
                                    {loan.status.replace("LOAN_STATUS_", "")}
                                  </option>
                                ))}
                              </datalist>
                              <FieldDescription>
                                Choose an eligible loan belonging to this
                                member.
                              </FieldDescription>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="credit-period">
                                Contribution month
                              </FieldLabel>
                              <Input
                                id="credit-period"
                                name="contributionPeriod"
                                type="month"
                                required
                              />
                            </Field>
                          </>
                        ) : null}
                        <Field>
                          <FieldLabel htmlFor="credit-consent">
                            Member instruction reference
                          </FieldLabel>
                          <Input
                            id="credit-consent"
                            name="consentReference"
                            required
                          />
                          <FieldDescription>
                            Record the member’s signed request or other retained
                            instruction.
                          </FieldDescription>
                        </Field>
                      </>
                    )}
                    {review && action === "record_refund" ? (
                      <>
                        <Field>
                          <FieldLabel htmlFor="credit-payout">
                            Verified payout reference
                          </FieldLabel>
                          <Input
                            id="credit-payout"
                            name="payoutReference"
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="credit-evidence">
                            Business payout verification reference
                          </FieldLabel>
                          <Textarea
                            id="credit-evidence"
                            name="payoutEvidence"
                            required
                          />
                        </Field>
                      </>
                    ) : null}
                    <Field>
                      <FieldLabel htmlFor="credit-reason">Reason</FieldLabel>
                      <Textarea
                        id="credit-reason"
                        name="reason"
                        minLength={5}
                        required
                      />
                    </Field>
                    <Button disabled={pending} type="submit">
                      {pending ? <Spinner data-icon="inline-start" /> : null}
                      {review
                        ? "Save refund review"
                        : action === "request_refund"
                          ? "Reserve refund amount"
                          : "Confirm member instruction"}
                    </Button>
                    {review ? (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setReview(null);
                          setAction("transfer_shares");
                        }}
                      >
                        Cancel review
                      </Button>
                    ) : null}
                  </FieldGroup>
                </form>
              ) : null}
              <div className="flex flex-col gap-3">
                <p className="font-medium">Credit history</p>
                {!workspace.operations.length ? (
                  <p className="text-sm text-muted-foreground">
                    No credit instructions recorded.
                  </p>
                ) : null}
                {workspace.operations.map((operation) => (
                  <Card key={operation.id} size="sm">
                    <CardHeader>
                      <CardTitle>
                        {formatLoanMoney(operation.amount)} ·{" "}
                        {operation.action.replaceAll("_", " ")}
                      </CardTitle>
                      <CardDescription>{operation.reason}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Badge variant="secondary">{operation.status}</Badge>
                      <p className="text-sm">
                        Instruction: {operation.consentReference}
                      </p>
                      {operation.payoutReference ? (
                        <p>Payout: {operation.payoutReference}</p>
                      ) : null}
                    </CardContent>
                    {workspace.context.canApproveCredit &&
                    operation.requestedBy !== workspace.context.staffId &&
                    !saved &&
                    ["pending", "approved"].includes(operation.status) ? (
                      <CardFooter className="flex flex-wrap gap-2">
                        {(operation.status === "pending"
                          ? ["approve_refund", "reject_refund"]
                          : ["record_refund"]
                        ).map((next) => (
                          <Button
                            key={next}
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              setReview(operation);
                              setAction(next);
                            }}
                          >
                            {next.replaceAll("_", " ")}
                          </Button>
                        ))}
                      </CardFooter>
                    ) : null}
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => selected && load(selected)}
                >
                  Refresh history
                </Button>
                {workspace.nextPageToken ? (
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      selected && load(selected, workspace.nextPageToken)
                    }
                  >
                    Older instructions
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
