import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  UserRound,
} from "lucide-react";

import type {
  ShareAccount,
  ShareMoney,
  ShareTransaction,
} from "@/lib/go-api-client";
import {
  formatShareDate,
  formatShareMoney,
  ShareAccountBadge,
} from "./share-badges";

// AccountSummary exposes the four account facts an administrator needs before taking action.
export function AccountSummary({
  account,
  balance,
  latest,
}: {
  account: ShareAccount;
  balance?: ShareMoney;
  latest?: ShareTransaction;
}) {
  const cards = [
    {
      label: "Current balance",
      value: formatShareMoney(balance),
      detail: "Strong consistency",
      icon: CircleDollarSign,
    },
    {
      label: "Account status",
      value: <ShareAccountBadge status={account.status} />,
      detail: `Branch ${account.branchId}`,
      icon: Activity,
    },
    {
      label: "Member No",
      value: account.memberNumber,
      detail: "Linked member",
      icon: UserRound,
    },
    {
      label: "Last activity",
      value: formatShareDate(latest?.createdAt, true),
      detail: latest ? "Latest loaded transaction" : "No transactions yet",
      icon: CalendarDays,
    },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, detail, icon: Icon }) => (
        <div
          className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          key={label}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <span className="rounded-lg bg-red-50 p-2 text-[#a91521]">
              <Icon className="size-4" />
            </span>
          </div>
          <div className="min-w-0 break-all text-xl font-bold text-stone-950">
            {value}
          </div>
          <p className="mt-2 text-xs text-stone-500">{detail}</p>
        </div>
      ))}
    </section>
  );
}
