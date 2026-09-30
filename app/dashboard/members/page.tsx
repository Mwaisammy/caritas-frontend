import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { GoApiError } from "@/lib/server/go-api";
import { getMember, listMembers } from "@/lib/server/members-api";
import type { Member, MemberStatus } from "@/lib/go-api-client";
import { MEMBER_BRANCH_ID } from "./config";
import { buttonClass, formatDate, MemberStatusBadge } from "./member-ui";

const PAGE_SIZE = 12;
const statuses: Array<{ value: "" | MemberStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "MEMBER_STATUS_PENDING", label: "Pending" },
  { value: "MEMBER_STATUS_ACTIVE", label: "Active" },
  { value: "MEMBER_STATUS_SUSPENDED", label: "Suspended" },
  { value: "MEMBER_STATUS_CLOSED", label: "Closed" },
  { value: "MEMBER_STATUS_REJECTED", label: "Rejected" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const valueOf = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

function decodeTrail(value: string) {
  if (!value) return [] as string[];
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

function membersUrl(status: string, pageToken?: string, trail: string[] = []) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (pageToken) params.set("pageToken", pageToken);
  if (trail.length)
    params.set(
      "trail",
      Buffer.from(JSON.stringify(trail)).toString("base64url"),
    );
  const query = params.toString();
  return `/dashboard/members${query ? `?${query}` : ""}`;
}

function initials(name?: string) {
  return (name ?? "Member")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ErrorCard({ error }: { error: unknown }) {
  const reference = error instanceof GoApiError ? error.requestId : undefined;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-950">
        Members could not be loaded
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-red-700">
        Check that the member service is running, then try again.
      </p>
      {reference ? (
        <p className="mt-3 font-mono text-xs text-red-600">
          Reference: {reference}
        </p>
      ) : null}
      <Link
        className={`${buttonClass("outline")} mt-5`}
        href="/dashboard/members"
      >
        Try again
      </Link>
    </div>
  );
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const statusValue = valueOf(query.status);
  const validStatus = statuses.some((item) => item.value === statusValue)
    ? (statusValue as MemberStatus | "")
    : "";
  const pageToken = valueOf(query.pageToken);
  const trail = decodeTrail(valueOf(query.trail));
  const lookup = valueOf(query.lookup).trim();
  const lookupBy =
    valueOf(query.lookupBy) === "nationalId" ? "nationalId" : "memberId";

  let members: Member[] = [];
  let nextPageToken = "";
  let loadError: unknown;
  try {
    if (lookup) {
      const result = await getMember(
        lookupBy === "nationalId"
          ? { branchId: MEMBER_BRANCH_ID, nationalId: lookup }
          : { branchId: MEMBER_BRANCH_ID, memberId: lookup },
      );
      members = result.member ? [result.member] : [];
    } else {
      const result = await listMembers({
        branchId: MEMBER_BRANCH_ID,
        pageSize: PAGE_SIZE,
        ...(pageToken ? { pageToken } : {}),
        ...(validStatus ? { statusFilter: validStatus } : {}),
      });
      members = result.members ?? [];
      nextPageToken = result.nextPageToken ?? "";
    }
  } catch (error) {
    loadError = error;
  }
  members.sort((a, b) =>
    a.memberNumber.localeCompare(b.memberNumber, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl  bg-rose-800  px-6 py-7 text-white shadow-[0_16px_45px_rgba(153,27,39,0.16)] sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-100">
                <Building2 className="size-4" />
                Branch 01 · Member administration
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Members</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-red-50/85">
                Register members, review profiles, and manage each account
                through its complete lifecycle.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#a91521] shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-3 focus:ring-white/40"
              href="/dashboard/members/new"
            >
              <UserPlus className="size-4" />
              Register member
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <form
              className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]"
              method="get"
            >
              <select
                aria-label="Lookup field"
                className="h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-[#b71925]"
                defaultValue={lookupBy}
                name="lookupBy"
              >
                <option value="memberId">Member ID</option>
                <option value="nationalId">National ID</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <input
                  className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm outline-none placeholder:text-stone-400 focus:border-[#b71925] focus:ring-3 focus:ring-red-100"
                  defaultValue={lookup}
                  name="lookup"
                  placeholder="Exact member or national ID"
                />
              </div>
              <button
                className="h-11 rounded-lg bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-800 focus:outline-none focus:ring-3 focus:ring-stone-200"
                type="submit"
              >
                Find member
              </button>
            </form>
            <form className="flex gap-2" method="get">
              <select
                aria-label="Filter by status"
                className="h-11 min-w-40 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-[#b71925]"
                defaultValue={validStatus}
                name="status"
              >
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                className="h-11 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-3 focus:ring-red-100"
                type="submit"
              >
                Apply
              </button>
            </form>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-500">
            <p>
              {lookup
                ? "Showing an exact lookup result."
                : `Showing up to ${PAGE_SIZE} members on this page.`}
            </p>
            {lookup || validStatus ? (
              <Link
                className="font-semibold text-[#a91521] hover:underline"
                href="/dashboard/members"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </section>

        {loadError ? (
          <ErrorCard error={loadError} />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold text-stone-950">
                  Member directory
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Branch 01 records
                </p>
              </div>
              <div className="rounded-xl bg-red-50 p-2.5 text-[#b71925]">
                <UsersRound className="size-5" />
              </div>
            </div>
            {members.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-2 py-3">Member no.</th>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">National ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {members.map((member) => (
                        <tr
                          className="relative cursor-pointer transition-colors hover:bg-red-50/30 focus-within:bg-red-50/50"
                          key={member.id}
                        >
                          <td className="px-6 py-4 font-mono text-xs text-stone-700">
                            {member.memberNumber}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-[#b71925]">
                                {initials(member.profile?.personal?.fullName)}
                              </div>
                              <div>
                                <Link
                                  aria-label={`View ${member.profile?.personal?.fullName ?? "member"}`}
                                  className="font-semibold text-stone-900 outline-none after:absolute after:inset-0 focus-visible:underline"
                                  href={`/dashboard/members/${encodeURIComponent(member.id)}`}
                                >
                                  {member.profile?.personal?.fullName ??
                                    "Unnamed member"}
                                </Link>
                                <p className="text-xs text-stone-500">
                                  {member.profile?.personal?.phone ||
                                    member.profile?.personal?.email ||
                                    "No contact provided"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-stone-600">
                            {member.nationalId}
                          </td>
                          <td className="px-4 py-4">
                            <MemberStatusBadge status={member.status} />
                          </td>
                          <td className="px-4 py-4 text-stone-600">
                            {formatDate(member.registeredAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-stone-100 md:hidden">
                  {members.map((member) => (
                    <Link
                      className="flex items-center gap-3 p-4 hover:bg-red-50/30"
                      href={`/dashboard/members/${encodeURIComponent(member.id)}`}
                      key={member.id}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-[#b71925]">
                        {initials(member.profile?.personal?.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-stone-900">
                          {member.profile?.personal?.fullName ??
                            "Unnamed member"}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          No. {member.memberNumber} ·{" "}
                          {member.profile?.personal?.phone || "No phone"}
                        </p>
                      </div>
                      <MemberStatusBadge status={member.status} />
                      <ChevronRight className="size-4 text-stone-400" />
                    </Link>
                  ))}
                </div>
              </>
            ) : pageToken ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                  <UsersRound />
                </div>
                <h3 className="mt-4 font-semibold text-stone-900">
                  No more members
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  You have reached the end of the member directory.
                </p>
                <Link
                  className={`${buttonClass("outline")} mt-5`}
                  href={membersUrl(
                    validStatus,
                    trail.at(-1),
                    trail.slice(0, -1),
                  )}
                >
                  <ArrowLeft className="size-4" />
                  Previous page
                </Link>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                  <UsersRound />
                </div>
                <h3 className="mt-4 font-semibold text-stone-900">
                  No members found
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  Try another filter or register the first matching member.
                </p>
              </div>
            )}
            {!lookup && members.length ? (
              <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/70 px-5 py-4">
                <p className="text-xs font-medium text-stone-500">
                  Page {trail.length + 1}
                </p>
                <div className="flex gap-2">
                  {trail.length ? (
                    <Link
                      className={buttonClass("outline")}
                      href={membersUrl(
                        validStatus,
                        trail.at(-1),
                        trail.slice(0, -1),
                      )}
                    >
                      <ArrowLeft className="size-4" />
                      Previous
                    </Link>
                  ) : (
                    <button
                      className={`${buttonClass("outline")} cursor-not-allowed opacity-50`}
                      disabled
                    >
                      <ArrowLeft className="size-4" />
                      Previous
                    </button>
                  )}
                  {nextPageToken ? (
                    <Link
                      className={buttonClass("outline")}
                      href={membersUrl(validStatus, nextPageToken, [
                        ...trail,
                        pageToken,
                      ])}
                    >
                      Next
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <button
                      className={`${buttonClass("outline")} cursor-not-allowed opacity-50`}
                      disabled
                    >
                      Next
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
