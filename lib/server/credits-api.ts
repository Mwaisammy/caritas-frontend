import "server-only";

import type {CreditBalance, CreditOperation} from "@/lib/go-api-client";
import {goApiGet, goApiPost} from "@/lib/server/go-api";

// getCreditBalance loads only credit associated with the displayed member and loan.
export const getCreditBalance = (input: {memberId: string; loanId?: string}) => goApiPost<{credits: CreditBalance[]}>("/api/v1/credits/balance", input);

// manageCredit keeps every spend on one stable operation ID; without it uncertain retries could reserve twice.
export const manageCredit = async (input: {
  operationId: string; creditBalanceId: string; action: string; amount?: string; targetId?: string;
  contributionPeriod?: string; reason: string; consentReference?: string; payoutReference?: string; payoutEvidence?: string;
}) => (await goApiPost<{ operation: CreditOperation }>("/api/v1/credits/manage", input)).operation;

// listCreditOperations preserves history cursors; without it partial reservations are invisible to staff.
export const listCreditOperations = async (creditBalanceId: string, pageToken = "") =>
  (await goApiGet(`/api/v1/credits/operations?${new URLSearchParams({ creditBalanceId, pageToken })}`)) as { operations: CreditOperation[]; nextPageToken?: string };
