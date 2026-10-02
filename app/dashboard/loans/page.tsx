import Link from "next/link";

import {LoanAnalytics} from "@/app/components/loans-ui/loan-analytics";
import {LoanDirectoryHeader} from "@/app/components/loans-ui/loan-directory-header";
import {LoanList} from "@/app/components/loans-ui/loan-list";
import type {Loan, LoanStatus} from "@/lib/go-api-client";
import {GoApiError} from "@/lib/server/go-api";
import {getLoan, listLoans} from "@/lib/server/loans-api";
import {LOAN_PAGE_SIZE} from "./config";

const statuses: LoanStatus[] = ["LOAN_STATUS_PENDING", "LOAN_STATUS_APPROVED", "LOAN_STATUS_REJECTED", "LOAN_STATUS_DISBURSED", "LOAN_STATUS_RESTRUCTURING", "LOAN_STATUS_ACTIVE", "LOAN_STATUS_DELINQUENT", "LOAN_STATUS_CLOSED", "LOAN_STATUS_WRITTEN_OFF", "LOAN_STATUS_MANUAL_REVIEW"];
// decodeTrail prevents malformed browser cursor history from breaking the directory.
function decodeTrail(value: string) { try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")); return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : []; } catch { return []; } }
// loansUrl preserves the active status while navigating backend cursors.
function loansUrl(status: string, pageToken = "", trail: string[] = []) { const query = new URLSearchParams(); if (status) query.set("status", status); if (pageToken) query.set("pageToken", pageToken); if (trail.length) query.set("trail", Buffer.from(JSON.stringify(trail)).toString("base64url")); return `/dashboard/loans${query.size ? `?${query}` : ""}`; }
// LoanLoadError distinguishes configuration, authentication, permission, and service failures without exposing response bodies.
function LoanLoadError({error}: {error: unknown}) { const messages: {[status: number]: string} = {400: "The loan service rejected the list request.", 401: "Your session was not accepted by the loan service.", 403: "Your account cannot view loans.", 404: "The loan list endpoint is not registered.", 500: "The loan service could not complete its database query.", 502: "The loan service could not be reached.", 504: "The loan service took too long to respond."}; const reference = error instanceof GoApiError ? error.requestId : undefined, message = error instanceof GoApiError ? messages[error.status] ?? "The loan service returned an unexpected response." : "The loan service is unavailable."; return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><h2 className="text-lg font-semibold text-red-950">Loans could not be loaded</h2><p className="mt-2 text-sm text-red-700">{message}</p>{reference ? <p className="mt-3 font-mono text-xs text-red-600">Reference: {reference}</p> : null}<Link className="mt-5 inline-flex h-10 items-center rounded-lg bg-red-700 px-4 text-sm font-semibold text-white" href="/dashboard/loans">Try again</Link></div>; }

// LoansPage coordinates exact lookup, status filtering, analytics, and cursor pagination.
export default async function LoansPage({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const query = await searchParams, lookup = typeof query.lookup === "string" ? query.lookup.trim() : "", lookupBy = query.lookupBy === "memberId" ? "memberId" : "loanId";
  const statusValue = typeof query.status === "string" ? query.status : "", status = statuses.includes(statusValue as LoanStatus) ? statusValue as LoanStatus : "";
  const pageToken = typeof query.pageToken === "string" ? query.pageToken : "", trail = decodeTrail(typeof query.trail === "string" ? query.trail : "");
  let loans: Loan[] = [], nextPageToken = "", loadError: unknown;
  try { if (lookupBy === "loanId" && lookup) { const result = await getLoan({loanId: lookup}); loans = result.loan ? [result.loan] : []; } else ({loans = [], nextPageToken = ""} = await listLoans({pageSize: LOAN_PAGE_SIZE, ...(pageToken && {pageToken}), ...(status && {statusFilter: status}), ...(lookup && {memberId: lookup})})); } catch (error) { loadError = error; }
  const previous = trail.length ? loansUrl(status, trail[trail.length - 1], trail.slice(0, -1)) : undefined, next = nextPageToken ? loansUrl(status, nextPageToken, [...trail, pageToken]) : undefined;
  return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"><div className="mx-auto max-w-7xl space-y-6"><LoanDirectoryHeader lookup={lookup} lookupBy={lookupBy} status={status} />{loadError ? <LoanLoadError error={loadError} /> : <><LoanAnalytics loans={loans} /><LoanList loans={loans} nextHref={lookup ? undefined : next} page={trail.length + 1} previousHref={lookup ? undefined : previous} /></>}</div></div>;
}
