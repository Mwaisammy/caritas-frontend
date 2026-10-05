import type {ShareAccountStatus, ShareMoney, ShareTransactionType} from "@/lib/go-api-client";

const accountStyles: Record<ShareAccountStatus, string> = {
  SHARE_ACCOUNT_STATUS_UNSPECIFIED: "bg-stone-100 text-stone-600",
  SHARE_ACCOUNT_STATUS_ACTIVE: "bg-emerald-50 text-emerald-700",
  SHARE_ACCOUNT_STATUS_DORMANT: "bg-amber-50 text-amber-700",
  SHARE_ACCOUNT_STATUS_CLOSED: "bg-stone-100 text-stone-600",
};
const transactionStyles: Record<ShareTransactionType, string> = {
  SHARE_TRANSACTION_TYPE_UNSPECIFIED: "bg-stone-100 text-stone-600",
  SHARE_TRANSACTION_TYPE_PURCHASE: "bg-emerald-50 text-emerald-700",
  SHARE_TRANSACTION_TYPE_WITHDRAWAL: "bg-amber-50 text-amber-700",
  SHARE_TRANSACTION_TYPE_DIVIDEND: "bg-blue-50 text-blue-700",
  SHARE_TRANSACTION_TYPE_REVERSAL: "bg-red-50 text-red-700",
  SHARE_TRANSACTION_TYPE_ADJUSTMENT: "bg-purple-50 text-purple-700",
};

// Human-readable enum labels keep protobuf prefixes out of the interface.
export function shareLabel(value: string) {
  return value.replace(/^SHARE_(ACCOUNT_STATUS|TRANSACTION_TYPE)_/, "").toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

// The account badge gives directory and detail views one consistent status treatment.
export function ShareAccountBadge({status}: {status: ShareAccountStatus}) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accountStyles[status]}`}>{shareLabel(status)}</span>;
}

// The transaction badge makes purchases, withdrawals, dividends, and corrections scannable.
export function ShareTransactionBadge({type}: {type: ShareTransactionType}) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${transactionStyles[type]}`}>{shareLabel(type)}</span>;
}

// Money formatting preserves the protobuf nanos value instead of rounding units prematurely.
export function formatShareMoney(money?: ShareMoney) {
  if (!money) return "—";
  const value = Number(money.units) + money.nanos / 1_000_000_000;
  return Number.isFinite(value) ? new Intl.NumberFormat("en-KE", {style: "currency", currency: money.currencyCode || "KES", maximumFractionDigits: 2}).format(value) : `${money.currencyCode} ${money.units}`;
}

// Date formatting keeps every share timestamp compact and consistent.
export function formatShareDate(value?: string, includeTime = false) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {day: "2-digit", month: "short", year: "numeric", ...(includeTime ? {hour: "2-digit", minute: "2-digit"} : {})}).format(date);
}
