// types/loans.ts

export type LoanStatus =
  | "LOAN_STATUS_PENDING"
  | "LOAN_STATUS_APPROVED"
  | "LOAN_STATUS_REJECTED"
  | "LOAN_STATUS_DISBURSED"
  | "LOAN_STATUS_ACTIVE"
  | "LOAN_STATUS_DELINQUENT"
  | "LOAN_STATUS_CLOSED"
  | "LOAN_STATUS_WRITTEN_OFF"
  | "LOAN_STATUS_RESTRUCTURING"
  | "LOAN_STATUS_MANUAL_REVIEW";

export interface Loan {
  id: string;
  member_id: string;
  branch_id: string;
  principal: string;
  interest_rate: string;
  repayment_period_months: number;
  status: LoanStatus;
  disbursed_at?: string;
  created_at: string;
  updated_at: string;
}