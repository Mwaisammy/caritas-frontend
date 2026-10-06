import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { ShareAccount } from "@/lib/go-api-client";
import { CreateAdjustmentDialog } from "./create-adjustment-dialog";
import { PurchaseSharesDialog } from "./purchase-shares-dialog";
import { ShareAccountBadge } from "./share-badges";
import { WithdrawSharesDialog } from "./withdraw-shares-dialog";

// ShareAccountHeader keeps account identity and its three primary actions visible together.
export function ShareAccountHeader({ account }: { account: ShareAccount }) {
  return (
    <section className="rounded-2xl bg-linear-to-r from-[#961521] to-[#c8242f] px-6 py-6 text-white shadow-[0_16px_45px_rgba(153,27,39,0.16)] sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-red-100 hover:text-white"
        href="/dashboard/shares"
      >
        <ArrowLeft className="size-4" />
        Share accounts
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="mb-3">
            <ShareAccountBadge status={account.status} />
          </div>
          <h1 className="break-all text-xl font-bold tracking-normal sm:text-xl">
            Share account
          </h1>
          <p className="mt-2 break-all font-mono text-2xl tracking-tight text-red-100 sm:text-3xl">
            {account.memberName}
          </p>
          <p className="mt-1 break-all font-mono tracking-tight text-sm text-red-50/85">
            Member No: {account.memberNumber}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 text-stone-950">
          <PurchaseSharesDialog accountId={account.id} />
          <WithdrawSharesDialog accountId={account.id} />
          <CreateAdjustmentDialog accountId={account.id} />
        </div>
      </div>
    </section>
  );
}
