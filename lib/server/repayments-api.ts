import "server-only";

import type {LoanTransaction, RepaymentSchedule} from "@/lib/go-api-client";
import {goApiPost} from "@/lib/server/go-api";

// recordRepayment records one gateway-backed payment and returns its allocation.
export const recordRepayment = (input: {loanId: string; amount: string; paymentGatewayTransactionId: string; createdBy: string}) => goApiPost<{transactionId: string; recordedAt: string; allocation: {principal: string; interest: string; penalty: string; credit: string}}>("/api/v1/repayments/record", input);
// getRepaymentSchedule loads the complete installment schedule used by the detail chart and table.
export const getRepaymentSchedule = (input: {loanId: string}) => goApiPost<{schedule: RepaymentSchedule[]}>("/api/v1/repayments/schedule", input);
// getPaymentHistory loads a bounded page of immutable loan transactions.
export const getPaymentHistory = (input: {loanId: string; pageSize: number; pageToken?: string; typeFilter?: string}) => goApiPost<{transactions: LoanTransaction[]; nextPageToken: string}>("/api/v1/repayments/history", input);
