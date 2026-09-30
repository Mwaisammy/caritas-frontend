import "server-only";

import type {ShareAccount, ShareAccountStatus, ShareMoney, ShareTransaction} from "@/lib/go-api-client";
import {goApiPost} from "@/lib/server/go-api";

// This wrapper keeps account creation's HTTP path out of its server action.
export const openShareAccount = (input: {memberId: string; branchId: string}) =>
  goApiPost<{accountId: string; status: ShareAccountStatus}>("/api/v1/shares/open-account", input);

// This wrapper supports internal account lookup plus the two identifiers administrators recognize.
export const getShareAccount = (input: {branchId: string; accountId?: string; memberNumber?: string; nationalId?: string}) =>
  goApiPost<{account?: ShareAccount}>("/api/v1/shares/get-account", input);


// This wrapper preserves the backend cursor used by the share directory.
export const listShareAccounts = (input: {branchId: string; pageSize: number; pageToken?: string; statusFilter?: ShareAccountStatus}) =>
  goApiPost<{accounts: ShareAccount[]; nextPageToken: string}>("/api/v1/shares/list-accounts", input);

// This wrapper sends purchases to the authoritative balance service.
export const purchaseShares = (input: {accountId: string; amount: ShareMoney; referenceId: string; originatorId: string; reason: string}) =>
  goApiPost<{transactionId: string; balanceAfter: ShareMoney}>("/api/v1/shares/purchase", input);

// This wrapper sends withdrawals to the authoritative balance service.
export const withdrawShares = (input: {accountId: string; amount: ShareMoney; referenceId: string; originatorId: string; reason: string}) =>
  goApiPost<{transactionId: string; balanceAfter: ShareMoney}>("/api/v1/shares/withdraw", input);

// This wrapper requests the current balance separately from account metadata.
export const getShareBalance = (input: {accountId: string; consistencyStrong: boolean}) =>
  goApiPost<{balance: ShareMoney}>("/api/v1/shares/balance", input);

// This wrapper preserves transaction cursors for account activity pagination.
export const listShareTransactions = (input: {accountId: string; pageSize: number; pageToken?: string}) =>
  goApiPost<{transactions: ShareTransaction[]; nextPageToken: string}>("/api/v1/shares/list-transactions", input);

// This wrapper creates an adjustment without implying that the UI can approve it.
export const createShareAdjustment = (input: {accountId: string; amount: ShareMoney; referenceId: string; originatorId: string; reason: string}) =>
  goApiPost<{adjustmentId: string}>("/api/v1/shares/create-adjustment", input);

// This wrapper isolates the transaction reversal endpoint from the dialog.
export const reverseShareTransaction = (input: {transactionId: string; referenceId: string; reason: string}) =>
  goApiPost<{transactionId: string; balanceAfter: ShareMoney}>("/api/v1/shares/reverse-transaction", input);
