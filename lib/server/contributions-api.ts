import "server-only";

import type {
  CashAllocationInput,
  CashContributionReceipt,
  CashierSession,
  ShareMoney,
  ContributionCharge,
  CashContext,
  CashDeposit,
} from "@/lib/go-api-client";
import { goApiGet, goApiPost } from "@/lib/server/go-api";

// openCashierSession opens a till or returns the authenticated cashier's existing open till.
export const openCashierSession = () =>
  goApiPost<{ session?: CashierSession }>(
    "/api/v1/contributions/open-cashier-session",
    {},
  );

// createCashContribution records one immutable cash receipt and its complete allocation plan.
export const createCashContribution = (input: {
  idempotencyKey: string;
  sessionId: string;
  memberId: string;
  amount: ShareMoney;
  contributionPeriod: string;
  allocations: CashAllocationInput[];
}) =>
  goApiPost<{ receipt?: CashContributionReceipt }>(
    "/api/v1/contributions/create-cash",
    input,
  );

// closeCashierSession reconciles the cashier's counted notes against authoritative receipts.
export const closeCashierSession = (input: {
  sessionId: string;
  countedAmount: ShareMoney;
  varianceReason: string;
}) =>
  goApiPost<{ session?: CashierSession }>(
    "/api/v1/contributions/close-cashier-session",
    input,
  );

export const getCashContext = async () =>
  (await goApiGet("/api/v1/contributions/cash-context")) as CashContext;
export const getContributionQuote = async (memberId: string, period: string) =>
  (await goApiGet(
    `/api/v1/contributions/quote?${new URLSearchParams({ memberId, contributionPeriod: period })}`,
  )) as { fees: CashAllocationInput[] };
export const listContributionCharges = async (
  memberId: string,
  pageToken = "",
) =>
  (await goApiGet(
    `/api/v1/contributions/charges?${new URLSearchParams({ memberId, pageToken, pageSize: "100" })}`,
  )) as { charges: ContributionCharge[]; nextPageToken?: string };
export const getCashReceipt = async (input: {
  receiptId?: string;
  idempotencyKey?: string;
}) =>
  (await goApiGet(
    `/api/v1/contributions/cash-receipt?${new URLSearchParams(input)}`,
  )) as { receipt?: CashContributionReceipt };
export const listCashierSessions = async (pageToken = "") =>
  (await goApiGet(
    `/api/v1/contributions/cashier-sessions?${new URLSearchParams({ pageToken, pageSize: "50" })}`,
  )) as { sessions: CashierSession[]; nextPageToken?: string };
export const listCashDeposits = async (pageToken = "") =>
  (await goApiGet(
    `/api/v1/contributions/cash-deposits?${new URLSearchParams({ pageToken, pageSize: "50" })}`,
  )) as { deposits: CashDeposit[]; nextPageToken?: string };
export const getCashDeposit = async (depositId: string) =>
  (await goApiGet(
    `/api/v1/contributions/cash-deposit?${new URLSearchParams({ depositId })}`,
  )) as { deposit?: CashDeposit };
export const acceptCashHandover = (sessionId: string) =>
  goApiPost<{ session?: CashierSession }>(
    "/api/v1/contributions/accept-cash-handover",
    { sessionId },
  );
export const recordCashDeposit = (input: {
  sessionIds: string[];
  amount: ShareMoney;
  bankReference: string;
}) =>
  goApiPost<{ deposit?: CashDeposit }>(
    "/api/v1/contributions/record-cash-deposit",
    input,
  );
export const verifyCashDeposit = (depositId: string) =>
  goApiPost<{ deposit?: CashDeposit }>(
    "/api/v1/contributions/verify-cash-deposit",
    { depositId },
  );
export const createContributionCharge = (input: {
  idempotencyKey: string;
  memberId: string;
  category: string;
  amount: ShareMoney;
  reason: string;
}) =>
  goApiPost<{ charge?: ContributionCharge }>(
    "/api/v1/contributions/charges",
    input,
  );
