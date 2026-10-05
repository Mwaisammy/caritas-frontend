import "server-only";

import type {GuarantorStatus, Loan, LoanGuarantor, LoanStatus, ProposedGuarantor, ShareMoney} from "@/lib/go-api-client";
import {goApiPost} from "@/lib/server/go-api";

// applyForLoan submits one validated application to the loan service.
export const applyForLoan = (input: {memberId: string; branchId: number; principal: string; interestRate: string; repaymentPeriodMonths: number; officerId: string; guarantors: ProposedGuarantor[]; applicantSharePledgeAmount: ShareMoney}) => goApiPost<{loanId: string; status: LoanStatus}>("/api/v1/loans/apply", input);
// approveLoan advances only a backend-approved pending application.
export const approveLoan = (input: {loanId: string; reason: string; officerId: string}) => goApiPost<{newStatus: LoanStatus; approvedAt: string}>("/api/v1/loans/approve", input);
// rejectLoan records the officer and reason for a rejected application.
export const rejectLoan = (input: {loanId: string; reason: string; loanOfficer: string}) => goApiPost<{newStatus: LoanStatus; rejectedAt: string}>("/api/v1/loans/reject", input);
// disburseLoan sends an approved loan to the backend's disbursement workflow.
export const disburseLoan = (input: {loanId: string; reason: string; loanOfficer: string}) => goApiPost<{newStatus: LoanStatus; disbursedAt: string; referenceId: string}>("/api/v1/loans/disburse", input);
// getLoan retrieves the authoritative record used by the loan workspace.
export const getLoan = (input: {loanId: string}) => goApiPost<{loan?: Loan}>("/api/v1/loans/get", input);
// listLoans preserves backend cursors and the two filters exposed by the contract.
export const listLoans = (input: {pageSize: number; pageToken?: string; statusFilter?: LoanStatus; memberId?: string}) => goApiPost<{loans: Loan[]; nextPageToken: string}>("/api/v1/loans/list", input);
// getLoanStatus provides the previous state and last transition date for the summary.
export const getLoanStatus = (input: {loanId: string}) => goApiPost<{status: LoanStatus; previousStatus: string; lastUpdated: string}>("/api/v1/loans/status", input);
// addGuarantor attaches one additional guarantee to an existing loan.
export const addGuarantor = (input: {loanId: string; guarantorId: string; guaranteedAmount: string}) => goApiPost<{status: GuarantorStatus; createdAt: string}>("/api/v1/loans/add-guarantor", input);
// removeGuarantor removes a guarantee only when the backend permits it.
export const removeGuarantor = (input: {loanId: string; guarantorId: string}) => goApiPost<{success: boolean}>("/api/v1/loans/remove-guarantor", input);
// approveGuarantor records the authenticated staff member who made the decision.
export const approveGuarantor = (input: {loanId: string; guarantorId: string; approvedBy: string}) => goApiPost<{newStatus: GuarantorStatus; approvedAt: string}>("/api/v1/loans/approve-guarantor", input);
// listGuarantors loads a bounded guarantor list for one loan workspace.
export const listGuarantors = (input: {loanId: string; pageSize: number; pageToken?: string}) => goApiPost<{guarantors: LoanGuarantor[]; nextPageToken: string}>("/api/v1/loans/list-guarantors", input);
