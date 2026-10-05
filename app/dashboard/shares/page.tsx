import Link from "next/link";

import { ShareAccountList } from "@/app/components/shares-ui/share-account-list";
import { ShareDirectoryHeader } from "@/app/components/shares-ui/share-directory-header";
import type { ShareAccount, ShareAccountStatus } from "@/lib/go-api-client";
import { GoApiError } from "@/lib/server/go-api";
import { getShareAccount, listShareAccounts } from "@/lib/server/shares-api";
import { SHARE_BRANCH_ID, SHARE_PAGE_SIZE } from "./config";

const statuses: ShareAccountStatus[] = [
  "SHARE_ACCOUNT_STATUS_ACTIVE",
  "SHARE_ACCOUNT_STATUS_DORMANT",
  "SHARE_ACCOUNT_STATUS_CLOSED",
];

// decodeTrail rejects malformed browser input so cursor history cannot break directory rendering.
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

// sharesUrl retains only the status and backend cursor needed for directory navigation.
function sharesUrl(status: string, pageToken = "", trail: string[] = []) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (pageToken) query.set("pageToken", pageToken);
  if (trail.length)
    query.set(
      "trail",
      Buffer.from(JSON.stringify(trail)).toString("base64url"),
    );
  return `/dashboard/shares${query.size ? `?${query}` : ""}`;
}

// ShareLoadError turns a service failure into a useful retry path without exposing backend details.
function ShareLoadError({ error }: { error: unknown }) {
  const reference = error instanceof GoApiError ? error.requestId : undefined;
  const status = error instanceof GoApiError ? error.status : 0;
  const messages = {
    400: "Check your search: enter a positive whole member number or an exact national ID.",
    401: "Your session has expired. Sign in again and retry.",
    403: "You do not have permission to view share accounts.",
    502: "The share service is unavailable. Please try again shortly.",
    503: "The share service is unavailable. Please try again shortly.",
    504: "The share service took too long to respond. Please try again.",
  };
  const message = messages[status as keyof typeof messages] ?? "The request failed. Please try again or contact support with the reference below.";
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-950">Share accounts could not be loaded</h2>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      {reference ? <p className="mt-3 font-mono text-xs text-red-600">Reference: {reference}</p> : null}
      <Link
        className="mt-5 inline-flex h-10 items-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-800"
        href="/dashboard/shares"
      >
        Try again
      </Link>
    </div>
  );
}

// SharesPage coordinates exact lookup and backend cursor pagination for the directory.
export default async function SharesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const lookup = typeof query.lookup === "string" ? query.lookup.trim() : "";
  const lookupBy = query.lookupBy === "nationalId" ? "nationalId" : "memberNumber";
  const statusValue = typeof query.status === "string" ? query.status : "";
  const status = statuses.includes(statusValue as ShareAccountStatus)
    ? (statusValue as ShareAccountStatus)
    : "";
  const pageToken = typeof query.pageToken === "string" ? query.pageToken : "";
  const trail = decodeTrail(typeof query.trail === "string" ? query.trail : "");
  let accounts: ShareAccount[] = [],
    nextPageToken = "",
    loadError: unknown;
  try {
    if (lookup) {
      const result = await getShareAccount({
        branchId: SHARE_BRANCH_ID,
        [lookupBy]: lookup,
      });
      accounts = result.account ? [result.account] : [];
    } else
      ({ accounts = [], nextPageToken = "" } = await listShareAccounts({
        branchId: SHARE_BRANCH_ID,
        pageSize: SHARE_PAGE_SIZE,
        ...(pageToken && { pageToken }),
        ...(status && { statusFilter: status }),
      }));
  } catch (error) {
    if (!(lookup && error instanceof GoApiError && error.status === 404))
      loadError = error;
  }
  const previous = trail.length
    ? sharesUrl(status, trail[trail.length - 1], trail.slice(0, -1))
    : undefined;
  const next = nextPageToken
    ? sharesUrl(status, nextPageToken, [...trail, pageToken])
    : undefined;
  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-7xl space-y-6">
        <ShareDirectoryHeader
          lookup={lookup}
          lookupBy={lookupBy}
          status={status}
        />
        {loadError ? (
          <ShareLoadError error={loadError} />
        ) : (
          <ShareAccountList
            accounts={accounts}
            nextHref={lookup ? undefined : next}
            page={lookup ? 1 : trail.length + 1}
            previousHref={lookup ? undefined : previous}
          />
        )}
      </div>
    </div>
  );
}
