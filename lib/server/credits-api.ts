import "server-only";

import type {CreditBalance} from "@/lib/go-api-client";
import {goApiPost} from "@/lib/server/go-api";

// getCreditBalance loads only credit associated with the displayed member and loan.
export const getCreditBalance = (input: {memberId: string; loanId?: string}) => goApiPost<{credits: CreditBalance[]}>("/api/v1/credits/balance", input);
// requestCreditWithdrawal submits an auditable request without changing balances in the browser.
export const requestCreditWithdrawal = (input: {creditBalanceId: string; amount: string; reason: string; requestedBy: string}) => goApiPost<{success: boolean; requestId: string; submittedAt: string}>("/api/v1/credits/request-withdrawal", input);
