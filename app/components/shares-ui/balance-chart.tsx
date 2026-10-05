import type {ShareTransaction} from "@/lib/go-api-client";
import {formatShareMoney} from "./share-badges";

// BalanceChart turns loaded balance-after values into a lightweight trend without a client chart dependency.
export function BalanceChart({transactions}: {transactions: ShareTransaction[]}) {
  const points = transactions.slice(0, 10).reverse();
  const values = points.map((item) => Number(item.balanceAfter.units) + item.balanceAfter.nanos / 1_000_000_000);
  const minimum = Math.min(...values), maximum = Math.max(...values), range = maximum - minimum || 1;
  const line = values.map((value, index) => `${values.length === 1 ? 50 : index * 100 / (values.length - 1)},${92 - (value - minimum) * 76 / range}`).join(" ");
  return <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-stone-950">Balance trend</h2><p className="mt-1 text-xs text-stone-500">Balance after the latest {points.length} loaded transactions</p></div>{points.at(-1) ? <p className="text-sm font-bold text-[#a91521]">{formatShareMoney(points.at(-1)?.balanceAfter)}</p> : null}</div>{points.length ? <div className="mt-6"><svg aria-label="Recent share balance trend" className="h-48 w-full overflow-visible" preserveAspectRatio="none" role="img" viewBox="0 0 100 100"><defs><linearGradient id="share-balance-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b71925" stopOpacity=".2" /><stop offset="1" stopColor="#b71925" stopOpacity="0" /></linearGradient></defs><path d={`M ${line.replaceAll(" ", " L ")} L 100 100 L 0 100 Z`} fill="url(#share-balance-fill)" /><polyline fill="none" points={line} stroke="#a91521" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg><div className="flex justify-between text-xs text-stone-400"><span>Earlier</span><span>Latest</span></div></div> : <div className="grid h-52 place-items-center text-sm text-stone-500">Balance history will appear after the first transaction.</div>}</section>;
}
