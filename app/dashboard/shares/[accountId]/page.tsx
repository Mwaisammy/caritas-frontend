import {notFound} from "next/navigation";

import {AccountSummary} from "@/app/components/shares-ui/account-summary";
import {BalanceChart} from "@/app/components/shares-ui/balance-chart";
import {ShareAccountHeader} from "@/app/components/shares-ui/share-account-header";
import {ShareTransactionList} from "@/app/components/shares-ui/share-transaction-list";
import {TransactionBars} from "@/app/components/shares-ui/transaction-bars";
import {GoApiError} from "@/lib/server/go-api";
import {
  getShareAccount,
  getShareBalance,
  listShareTransactions,
} from "@/lib/server/shares-api";
import {SHARE_BRANCH_ID, SHARE_TRANSACTION_PAGE_SIZE} from "../config";

// decodeTrail rejects malformed cursor history instead of letting it break account rendering.
function decodeTrail(value: string) {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

// transactionsUrl keeps account activity pagination scoped to its current account.
function transactionsUrl(
  accountId: string,
  pageToken = "",
  trail: string[] = [],
) {
  const query = new URLSearchParams();
  if (pageToken) query.set("pageToken", pageToken);
  if (trail.length)
    query.set(
      "trail",
      Buffer.from(JSON.stringify(trail)).toString("base64url"),
    );
  return `/dashboard/shares/${encodeURIComponent(accountId)}${query.size ? `?${query}` : ""}`;
}

// ShareAccountPage loads authoritative account, balance, and activity data for one workspace.
export default async function ShareAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{accountId: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{accountId}, query] = await Promise.all([params, searchParams]);
  const pageToken = typeof query.pageToken === "string" ? query.pageToken : "";
  const trail = decodeTrail(typeof query.trail === "string" ? query.trail : "");
  let accountResult;
  try {
    accountResult = await getShareAccount({
      accountId,
      branchId: SHARE_BRANCH_ID,
    });
  } catch (error) {
    if (error instanceof GoApiError && error.status === 404) notFound();
    throw error;
  }
  if (!accountResult.account) notFound();
  const [balanceResult, activity] = await Promise.all([
    getShareBalance({accountId, consistencyStrong: true}),
    listShareTransactions({
      accountId,
      pageSize: SHARE_TRANSACTION_PAGE_SIZE,
      ...(pageToken && {pageToken}),
    }),
  ]);
  const transactions = activity.transactions ?? [];
  const previous = trail.length
    ? transactionsUrl(accountId, trail[trail.length - 1], trail.slice(0, -1))
    : undefined;
  const next = activity.nextPageToken
    ? transactionsUrl(accountId, activity.nextPageToken, [...trail, pageToken])
    : undefined;
  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-7xl space-y-6">
        <ShareAccountHeader account={accountResult.account} />
        <AccountSummary
          account={accountResult.account}
          memberNo={accountResult.account.memberNumber}
          memberName={accountResult.account.memberName}
          balance={balanceResult.balance}
          latest={transactions[0]}
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <BalanceChart transactions={transactions} />
          <TransactionBars transactions={transactions} />
        </div>
        <ShareTransactionList
          accountId={accountId}
          nextHref={next}
          page={trail.length + 1}
          previousHref={previous}
          transactions={transactions}
        />
      </div>
    </div>
  );
}
