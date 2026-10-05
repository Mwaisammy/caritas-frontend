import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Landmark } from "lucide-react";

import type { ShareAccount } from "@/lib/go-api-client";
import { formatShareDate, ShareAccountBadge } from "./share-badges";

// ShareAccountList makes each account row navigable and keeps the same information usable on small screens.
export function ShareAccountList({
  accounts,
  page,
  previousHref,
  nextHref,
}: {
  accounts: ShareAccount[];
  page: number;
  previousHref?: string;
  nextHref?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-semibold text-stone-950">Account directory</h2>
          <p className="mt-1 text-xs text-stone-500">
            Page {page} · Select an account to view its balance and activity.
          </p>
        </div>
        <Landmark className="size-5 text-stone-400" />
      </div>
      {accounts.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Member No</th>
                  <th className="px-6 py-3 font-semibold">Member Name</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Opened</th>
                  <th className="px-6 py-3 font-semibold">Updated</th>
                  <th className="w-10 px-6 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {accounts.map((account) => (
                  <tr className="group hover:bg-red-50/45" key={account.id}>
                    <td className="p-0" colSpan={6}>
                      <Link
                        className="grid grid-cols-[minmax(10rem,1.25fr)_minmax(10rem,1fr)_minmax(7rem,.7fr)_minmax(8rem,.8fr)_minmax(8rem,.8fr)_2.5rem] items-center px-6 py-4"
                        href={`/dashboard/shares/${account.id}`}
                      >
                        <span className="min-w-0 wrap-break-word font-semibold text-stone-900">
                          {account.memberNumber || "Not available"}
                        </span>
                        <span className="min-w-0 wrap-break-word text-stone-700">
                          {account.memberName || "Not available"}
                        </span>
                        <span>
                          <ShareAccountBadge status={account.status} />
                        </span>
                        <span className="text-stone-600">
                          {formatShareDate(account.openedAt)}
                        </span>
                        <span className="text-stone-600">
                          {formatShareDate(account.updatedAt)}
                        </span>
                        <ChevronRight className="size-4 text-stone-400 group-hover:text-[#a91521]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-stone-100 md:hidden">
            {accounts.map((account) => (
              <Link
                className="flex items-center gap-3 p-5 hover:bg-red-50/45"
                href={`/dashboard/shares/${account.id}`}
                key={account.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="wrap-break-word font-semibold text-stone-950">
                      {account.memberName || "Not available"}
                    </p>
                    <ShareAccountBadge status={account.status} />
                  </div>
                  <p className="wrap-break-word text-sm text-stone-700">
                    Member no. {account.memberNumber || "Not available"}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    Opened {formatShareDate(account.openedAt)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-stone-400" />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="px-6 py-16 text-center">
          <Landmark className="mx-auto size-9 text-stone-300" />
          <h3 className="mt-3 font-semibold text-stone-900">
            {page > 1 ? "No more share accounts" : "No share accounts found"}
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            {page > 1
              ? "Return to the previous page to continue browsing."
              : "Try another filter or open a member's first share account."}
          </p>
        </div>
      )}
      {previousHref || nextHref ? (
        <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4">
          <span>
            {previousHref ? (
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-[#a91521]"
                href={previousHref}
              >
                <ArrowLeft className="size-4" />
                Previous
              </Link>
            ) : null}
          </span>
          <span>
            {nextHref ? (
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#a91521]"
                href={nextHref}
              >
                Next
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </span>
        </div>
      ) : null}
    </section>
  );
}
