import "server-only";

import type {CreditBalance} from "@/lib/go-api-client";
import {goApiPost} from "@/lib/server/go-api";

// getCreditBalance loads only credit associated with the displayed member and loan.
export const getCreditBalance = (input: {memberId: string; loanId?: string}) => goApiPost<{credits: CreditBalance[]}>("/api/v1/credits/balance", input);
// requestCreditWithdrawal submits an auditable request without changing balances in the browser.
export const requestCreditWithdrawal = (input: {creditBalanceId: string; amount: string; reason: string; requestedBy: string; idempotencyKey: string; consentReference: string}) => goApiPost<{success: boolean; requestId: string; submittedAt: string}>("/api/v1/credits/request-withdrawal", input);

// CreditOperation explains why original credit differs from available credit without inventing a second balance calculation.
export interface CreditOperation {id: string; amount: string; action: string; status: string; reason: string; consentReference: string; payoutReference?: string; createdAt: string}

// listCreditOperations preserves the backend cursor for auditable refund and transfer history.
export const listCreditOperations = (creditBalanceId: string, pageToken = "") =>
  goApiPost<{operations: CreditOperation[]; nextPageToken?: string}>(`/api/v1/credits/operations?${new URLSearchParams({creditBalanceId, ...(pageToken && {pageToken})})}`, undefined, "GET");
