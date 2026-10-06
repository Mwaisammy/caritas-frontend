import type {MemberStatus, RelationshipType} from "@/lib/go-api-client";

const statusLabels: Record<MemberStatus, string> = {
  MEMBER_STATUS_UNSPECIFIED: "Unspecified",
  MEMBER_STATUS_PENDING: "Pending",
  MEMBER_STATUS_ACTIVE: "Active",
  MEMBER_STATUS_SUSPENDED: "Suspended",
  MEMBER_STATUS_CLOSED: "Closed",
  MEMBER_STATUS_REJECTED: "Rejected",
};

const statusStyles: Record<MemberStatus, string> = {
  MEMBER_STATUS_UNSPECIFIED: "bg-stone-100 text-stone-600 ring-stone-200",
  MEMBER_STATUS_PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  MEMBER_STATUS_ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  MEMBER_STATUS_SUSPENDED: "bg-orange-50 text-orange-700 ring-orange-200",
  MEMBER_STATUS_CLOSED: "bg-stone-100 text-stone-600 ring-stone-200",
  MEMBER_STATUS_REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

export function memberStatusLabel(status: MemberStatus) {
  return statusLabels[status] ?? status.replace("MEMBER_STATUS_", "");
}

export function MemberStatusBadge({status}: {status: MemberStatus}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {memberStatusLabel(status)}
    </span>
  );
}

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus:ring-3 focus:ring-red-100";

export function buttonClass(variant: "primary" | "outline" | "ghost" | "icon" = "primary") {
  const styles = {
    primary: "h-10 bg-[#b71925] text-white hover:bg-[#981521]",
    outline: "h-10 border border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
    ghost: "h-10 text-stone-700 hover:bg-stone-100",
    icon: "size-9 p-0 text-stone-600 hover:bg-stone-100",
  };
  return `${buttonBase} ${styles[variant]}`;
}

export function relationshipLabel(value?: RelationshipType) {
  if (!value || value === "RELATIONSHIP_TYPE_UNSPECIFIED") return "—";
  return value.replace("RELATIONSHIP_TYPE_", "").toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function formatDate(value?: string, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? {hour: "2-digit", minute: "2-digit"} : {}),
  }).format(date);
}

export function formatMoney(currency = "KES", units = "0", nanos = 0) {
  const value = Number(units) + nanos / 1_000_000_000;
  if (!Number.isFinite(value)) return `${currency} ${units}`;
  return new Intl.NumberFormat("en-KE", {style: "currency", currency, maximumFractionDigits: 2}).format(value);
}
