import {notFound} from "next/navigation";

import {CreditBalance} from "@/app/components/loans-ui/credit-balance";
import {GuarantorList} from "@/app/components/loans-ui/guarantor-list";
import {LoanHeader} from "@/app/components/loans-ui/loan-header";
import {LoanSectionError} from "@/app/components/loans-ui/loan-section-error";
import {LoanSummary} from "@/app/components/loans-ui/loan-summary";
import {PaymentHistory} from "@/app/components/loans-ui/payment-history";
import {RepaymentOverview} from "@/app/components/loans-ui/repayment-overview";
import {RepaymentSchedule} from "@/app/components/loans-ui/repayment-schedule";
import {getCreditBalance} from "@/lib/server/credits-api";
import {GoApiError} from "@/lib/server/go-api";
import {getLoan, getLoanStatus, listGuarantors} from "@/lib/server/loans-api";
import {getPaymentHistory, getRepaymentSchedule} from "@/lib/server/repayments-api";
import {LOAN_DETAIL_PAGE_SIZE} from "../config";

// loanUrl advances one optional section cursor while preserving the other section's position.
function loanUrl(loanId: string, historyToken = "", guarantorToken = "") { const query = new URLSearchParams(); if (historyToken) query.set("historyToken", historyToken); if (guarantorToken) query.set("guarantorToken", guarantorToken); return `/dashboard/loans/${encodeURIComponent(loanId)}${query.size ? `?${query}` : ""}`; }

// LoanPage composes authoritative loan, guarantor, repayment, and credit data into one workspace.
export default async function LoanPage({params, searchParams}: {params: Promise<{loanId: string}>; searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const [{loanId}, query] = await Promise.all([params, searchParams]);
  const historyToken = typeof query.historyToken === "string" ? query.historyToken : "", guarantorToken = typeof query.guarantorToken === "string" ? query.guarantorToken : "";
  let loanResult;
  try { loanResult = await getLoan({loanId}); } catch (error) { if (error instanceof GoApiError && error.status === 404) notFound(); throw error; }
  if (!loanResult.loan) notFound();
  const loan = loanResult.loan;
  const [statusResult, guarantorResult, scheduleResult, historyResult, creditResult] = await Promise.allSettled([getLoanStatus({loanId}), listGuarantors({loanId, pageSize: LOAN_DETAIL_PAGE_SIZE, ...(guarantorToken && {pageToken: guarantorToken})}), getRepaymentSchedule({loanId}), getPaymentHistory({loanId, pageSize: LOAN_DETAIL_PAGE_SIZE, ...(historyToken && {pageToken: historyToken})}), getCreditBalance({memberId: loan.memberId, loanId})]);
  const status = statusResult.status === "fulfilled" ? statusResult.value : {previousStatus: loan.previousStatus, lastUpdated: loan.updatedAt}, guarantors = guarantorResult.status === "fulfilled" ? guarantorResult.value : null, schedule = scheduleResult.status === "fulfilled" ? scheduleResult.value : null, history = historyResult.status === "fulfilled" ? historyResult.value : null, credits = creditResult.status === "fulfilled" ? creditResult.value : null;
  const historyNext = history?.nextPageToken ? loanUrl(loanId, history.nextPageToken, guarantorToken) : undefined, guarantorNext = guarantors?.nextPageToken ? loanUrl(loanId, historyToken, guarantors.nextPageToken) : undefined;
  return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"><div className="mx-auto max-w-7xl space-y-6"><LoanHeader loan={loan} /><LoanSummary lastUpdated={status.lastUpdated} loan={loan} previousStatus={status.previousStatus} />{schedule ? <RepaymentOverview schedule={schedule.schedule ?? []} /> : <LoanSectionError section="Repayment analytics" />}<div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">{schedule ? <RepaymentSchedule schedule={schedule.schedule ?? []} /> : <LoanSectionError section="Repayment schedule" />}{guarantors ? <GuarantorList guarantors={guarantors.guarantors ?? []} loanId={loanId} nextHref={guarantorNext} /> : <LoanSectionError section="Guarantors" />}</div>{credits ? <CreditBalance credits={credits.credits ?? []} loanId={loanId} /> : <LoanSectionError section="Credit information" />}{history ? <PaymentHistory nextHref={historyNext} transactions={history.transactions ?? []} /> : <LoanSectionError section="Payment history" />}</div></div>;
}
