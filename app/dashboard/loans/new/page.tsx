import Link from "next/link";
import {notFound} from "next/navigation";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {loanLabel} from "@/app/components/loans-ui/loan-badges";
import {getLoan} from "@/lib/server/loans-api";
import {getMember} from "@/lib/server/members-api";
import {GoApiError} from "@/lib/server/go-api";
import {LOAN_BRANCH_ID} from "../config";
import {LoanApplicationForm} from "@/app/components/loans-ui/loan-application-form";

// NewLoanPage gives the longer application flow its own focused route.
export default async function NewLoanPage({
  searchParams,
}: {
  searchParams: Promise<{memberId?: string}>;
}) {
  const {memberId} = await searchParams;
  let member;
  let existingLoan;
  let loanCheckFailed = false;
  if (typeof memberId === "string" && memberId) {
    try {
      ({member} = await getMember({
        branchId: String(LOAN_BRANCH_ID),
        memberId,
      }));
    } catch (error) {
      if (error instanceof GoApiError && error.status === 404) notFound();
      throw error;
    }
    if (!member) notFound();
    try {
      ({loan: existingLoan} = await getLoan({memberId: member.id}));
      loanCheckFailed = !existingLoan;
    } catch (error) {
      if (!(error instanceof GoApiError && error.status === 404))
        loanCheckFailed = true;
    }
  }
  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl bg-linear-to-r from-[#961521] to-[#c8242f] px-6 py-7 text-white shadow-sm sm:px-8">
          <p className="text-sm font-medium text-red-100">
            Loan administration
          </p>
          <h1 className="mt-2 text-3xl font-bold">New loan application</h1>
          <p className="mt-2 text-sm text-red-50/85">
            Capture the terms, share pledge, and proposed guarantors for review.
          </p>
        </section>
        {member ? (
          existingLoan ? (
            <Alert>
              <AlertTitle>
                Existing loan: {loanLabel(existingLoan.status)}
              </AlertTitle>
              <AlertDescription>
                <p>
                  This member has an existing loan that must be closed before
                  another application.
                </p>
                <Link href={`/dashboard/loans/${existingLoan.id}`}>
                  View loan
                </Link>
              </AlertDescription>
            </Alert>
          ) : loanCheckFailed ? (
            <Alert variant="destructive">
              <AlertTitle>Could not verify existing loans</AlertTitle>
              <AlertDescription>
                Please reload this page to check before applying.
              </AlertDescription>
            </Alert>
          ) : (
            <LoanApplicationForm member={member} />
          )
        ) : (
          <Link
            className="inline-flex h-11 items-center rounded-lg border border-stone-200 bg-white px-5 text-sm font-semibold"
            href="/dashboard/members"
          >
            Select a member to apply for a loan
          </Link>
        )}
      </div>
    </div>
  );
}
