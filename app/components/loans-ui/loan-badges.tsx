import type {CreditStatus, GuarantorStatus, LoanStatus, RepaymentStatus, ShareMoney} from "@/lib/go-api-client";

// loanMoneyUnits keeps preview sums and limit comparisons exact at the ledger's four-decimal precision.
export function loanMoneyUnits(value: string) {
  if (!/^\d+(\.\d{1,4})?$/.test(value)) return null;
  const [units, fraction = ""] = value.split(".");
  return BigInt(units) * BigInt(10_000) + BigInt(fraction.padEnd(4, "0"));
}

// formatLoanRate translates the stored monthly fraction into the percentage officers entered.
export function formatLoanRate(value: string) {
  const rate = loanMoneyUnits(value);
  if (rate === null) return "—";
  return `${rate / BigInt(100)}.${(rate % BigInt(100)).toString().padStart(2, "0")}%`;
}

// shareMoneyDecimal preserves protobuf money precision when displaying the backend's guarantee allowance.
export function shareMoneyDecimal(value: ShareMoney) {
  const scaled = (BigInt(value.units || "0") * BigInt(1_000_000_000) + BigInt(value.nanos || 0)) / BigInt(100_000);
  return `${scaled / BigInt(10_000)}.${(scaled % BigInt(10_000)).toString().padStart(4, "0")}`;
}

const colors: {[key: string]: string} = {PENDING: "bg-amber-50 text-amber-700", APPROVED: "bg-blue-50 text-blue-700", REJECTED: "bg-red-50 text-red-700", DISBURSED: "bg-indigo-50 text-indigo-700", RESTRUCTURING: "bg-purple-50 text-purple-700", ACTIVE: "bg-emerald-50 text-emerald-700", DELINQUENT: "bg-red-50 text-red-700", CLOSED: "bg-stone-100 text-stone-600", WRITTEN_OFF: "bg-red-100 text-red-900", MANUAL_REVIEW: "bg-purple-50 text-purple-700", UPCOMING: "bg-blue-50 text-blue-700", DUE: "bg-amber-50 text-amber-700", PAID: "bg-emerald-50 text-emerald-700", MISSED: "bg-red-50 text-red-700", PARTIAL: "bg-purple-50 text-purple-700", AVAILABLE: "bg-emerald-50 text-emerald-700", FROZEN: "bg-amber-50 text-amber-700", WITHDRAWN: "bg-stone-100 text-stone-600"};

// loanLabel removes protobuf prefixes so every status remains readable to administrators.
export function loanLabel(value: string) { return value.replace(/^(LOAN_STATUS|GUARANTOR_STATUS|REPAYMENT_STATUS|CREDIT_STATUS|TRANSACTION_TYPE)_/, "").toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
// LoanBadge applies one semantic treatment across loan, guarantor, repayment, and credit states.
export function LoanBadge({status}: {status: LoanStatus | GuarantorStatus | RepaymentStatus | CreditStatus}) { const key = status.replace(/^(LOAN_STATUS|GUARANTOR_STATUS|REPAYMENT_STATUS|CREDIT_STATUS)_/, ""); return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[key] ?? "bg-stone-100 text-stone-600"}`}>{loanLabel(status)}</span>; }
// formatLoanMoney formats backend decimal strings consistently without changing their stored precision.
export function formatLoanMoney(value?: string) { const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat("en-KE", {style: "currency", currency: "KES", maximumFractionDigits: 2}).format(amount) : "—"; }
// formatLoanDate keeps all loan timestamps consistent and handles absent protobuf timestamps.
export function formatLoanDate(value?: string, includeTime = false) { const date = value ? new Date(value) : null; return !date || Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-KE", {day: "2-digit", month: "short", year: "numeric", ...(includeTime ? {hour: "2-digit", minute: "2-digit"} : {})}).format(date); }
