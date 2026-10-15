"use client";

import {useActionState, useState} from "react";
import Link from "next/link";
import {ArrowRight, LoaderCircle, Plus, ShieldCheck, Trash2} from "lucide-react";

import {addGuarantorAction, approveGuarantorAction, removeGuarantorAction} from "@/app/dashboard/loans/actions";
import type {LoanActionState} from "@/app/dashboard/loans/actions";
import type {Loan, LoanGuarantor} from "@/lib/go-api-client";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from "@/components/ui/empty";
import {GuarantorFields} from "./guarantor-fields";
import {LoanFeedback} from "./form-parts";
import {formatLoanMoney, LoanBadge} from "./loan-badges";

// GuarantorButton keeps each decision's pending state and visible feedback beside its guarantee.
function GuarantorButton({loanId, guarantorId, kind}: {loanId: string; guarantorId: string; kind: "approve" | "remove"}) {
  const [state, action, pending] = useActionState(kind === "approve" ? approveGuarantorAction : removeGuarantorAction, null);
  const Icon = kind === "approve" ? ShieldCheck : Trash2;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input name="loanId" type="hidden" value={loanId} />
      <input name="guarantorId" type="hidden" value={guarantorId} />
      <Button variant="outline" size="sm" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Icon data-icon="inline-start" />}
        {kind === "approve" ? "Approve" : "Remove"}
      </Button>
      <LoanFeedback state={state} />
    </form>
  );
}

// AddGuarantorForm owns submission state so unmounting on close clears errors
// along with the fields; keeping it in the dialog would preserve old feedback.
function AddGuarantorForm({loan, onAdded}: {loan: Loan; onAdded: () => void}) {
  const [state, action, pending] = useActionState(async (previous: LoanActionState, formData: FormData) => {
    const result = await addGuarantorAction(previous, formData);
    if (!result?.ok) return result;
    onAdded();
    return null;
  }, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input name="loanId" type="hidden" value={loan.id} />
      <GuarantorFields applicantId={loan.memberId} disabled={pending} required state={state} />
      <LoanFeedback state={state} />
      <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}Add guarantor</Button>
    </form>
  );
}

// AddGuarantorDialog reuses the application capacity check so new guarantees follow the same rules.
function AddGuarantorDialog({loan}: {loan: Loan}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}><Plus data-icon="inline-start" />Add guarantor</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add guarantor</DialogTitle>
          <DialogDescription>A guarantor can offer their current shares minus all active pledges. Shares are reserved when the guarantee is approved.</DialogDescription>
        </DialogHeader>
        {open ? <AddGuarantorForm loan={loan} onAdded={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

// GuarantorList displays approved coverage separately from proposals so an
// undersecured loan cannot appear ready for approval.
export function GuarantorList({loan, guarantors, nextHref}: {loan: Loan; guarantors: LoanGuarantor[]; nextHref?: string}) {
  const canChange = loan.status === "LOAN_STATUS_PENDING";
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Guarantors and security</h2>
        {canChange ? <AddGuarantorDialog loan={loan} /> : null}
      </div>
      {canChange || loan.status === "LOAN_STATUS_APPROVED" ? (
        <Alert>
          <AlertTitle>Loan security coverage</AlertTitle>
          <AlertDescription>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
              <dt>Principal</dt><dd>{formatLoanMoney(loan.principal)}</dd>
              <dt>Applicant pledge</dt><dd>{formatLoanMoney(loan.applicantSharePledge)}</dd>
              <dt>Approved guarantees</dt><dd>{formatLoanMoney(loan.approvedGuarantorCoverage)}</dd>
              <dt>Remaining shortfall</dt><dd>{formatLoanMoney(loan.collateralShortfall)}</dd>
            </dl>
            <p>Pending guarantees do not count. Approve enough security to cover the principal; extra pending guarantors do not block loan approval. Eligibility and active security are checked again before disbursement.</p>
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="text-sm text-muted-foreground">A guarantor can offer their current shares minus all active pledges. Approval reserves the guaranteed amount.</p>
      {guarantors.length ? guarantors.map((item) => (
        <div key={item.guarantorId} className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{item.guarantorName || "Unnamed member"}</h3>
              <p className="text-xs text-muted-foreground">Member no. {item.guarantorNumber || "Unavailable"}</p>
            </div>
            <strong>{formatLoanMoney(item.guaranteedAmount)}</strong>
            <LoanBadge status={item.status} />
          </div>
          {canChange && item.status !== "GUARANTOR_STATUS_REJECTED" ? (
            <div className="flex flex-col gap-2">
              {item.status === "GUARANTOR_STATUS_PENDING" ? <GuarantorButton guarantorId={item.guarantorId} kind="approve" loanId={loan.id} /> : null}
              <GuarantorButton guarantorId={item.guarantorId} kind="remove" loanId={loan.id} />
            </div>
          ) : null}
        </div>
      )) : (
        <Empty><EmptyHeader><EmptyTitle>No guarantors attached</EmptyTitle><EmptyDescription>Guarantors are optional when applicant security covers the principal.</EmptyDescription></EmptyHeader></Empty>
      )}
      {nextHref ? <Button variant="outline" render={<Link href={nextHref} />}>More guarantors<ArrowRight data-icon="inline-end" /></Button> : null}
    </section>
  );
}
