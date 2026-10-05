import type {ShareTransaction} from "@/lib/go-api-client";
import {formatShareMoney} from "./share-badges";

// TransactionBars compares recent purchase and withdrawal sizes without implying branch-wide totals.
export function TransactionBars({transactions}: {transactions: ShareTransaction[]}) {
  const items = transactions.filter((item) => item.type.endsWith("PURCHASE") || item.type.endsWith("WITHDRAWAL")).slice(0, 7).reverse();
  const values = items.map((item) => Math.abs(Number(item.amount.units) + item.amount.nanos / 1_000_000_000));
  const maximum = Math.max(...values, 1);
  return <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div><h2 className="font-semibold text-stone-950">Purchase vs withdrawal</h2><p className="mt-1 text-xs text-stone-500">Amounts from recent loaded transactions</p></div>{items.length ? <div className="mt-6 flex h-52 items-end gap-3 border-b border-stone-200 px-2">{items.map((item, index) => <div className="group flex min-w-0 flex-1 flex-col items-center justify-end" key={item.id}><span className="mb-2 hidden max-w-24 text-center text-[10px] font-semibold text-stone-600 group-hover:block">{formatShareMoney(item.amount)}</span><div className={`w-full max-w-10 rounded-t-md ${item.type.endsWith("PURCHASE") ? "bg-emerald-500" : "bg-amber-500"}`} style={{height: `${Math.max(values[index] / maximum * 160, 8)}px`}} /></div>)}</div> : <div className="grid h-52 place-items-center text-sm text-stone-500">Purchases and withdrawals will appear here.</div>}<div className="mt-4 flex gap-5 text-xs text-stone-600"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-500" />Purchases</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-amber-500" />Withdrawals</span></div></section>;
}
