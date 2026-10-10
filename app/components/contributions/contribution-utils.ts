import type { CashAllocationType, ShareMoney } from "@/lib/go-api-client";
import type { CashLoanDetails } from "@/app/dashboard/contributions/actions";

// AllocationAmounts is the editable cash split kept locally until review.
export type AllocationAmounts = {
  cash: string;
  shares: string;
  charges: Record<string, string>;
  loans: Record<string, string>;
};

// ContributionAllocationDraft preserves the exact allocation shown during review and printing.
export type ContributionAllocationDraft = {
  type: CashAllocationType;
  targetId?: string;
  amount: string;
};

// ContributionDraft is the immutable browser snapshot submitted for one receipt.
export type ContributionDraft = {
  contributionPeriod: string;
  allocations: ContributionAllocationDraft[];
  amount: string;
};

// emptyAmounts initializes editable cash and targets; monthly fees come from the backend quote.
export function emptyAmounts(loans: CashLoanDetails[] = []): AllocationAmounts {
  return {
    cash: "",
    shares: "",
    charges: {},
    loans: Object.fromEntries(loans.map(({ loan }) => [loan.id, ""])),
  };
}

// minorUnits totals validated decimal input without floating-point money arithmetic.
export function minorUnits(value: string) {
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value)) return 0;
  const [units, fraction = ""] = value.split(".");
  return Number(units) * 100 + Number(fraction.padEnd(2, "0"));
}

// currentPeriod uses the cashier's local month rather than the UTC month.
export function currentPeriod() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

// draftAllocations omits blank rows and attaches the authoritative share and loan targets.
export function draftAllocations(
  amounts: AllocationAmounts,
  shareAccountId?: string,
  charges: import("@/lib/go-api-client").ContributionCharge[] = [],
  fees: ContributionAllocationDraft[] = [],
): ContributionAllocationDraft[] {
  const rows: ContributionAllocationDraft[] = [
    ...fees,
    ...charges.map((charge) => ({
      type: (charge.category === "penalty"
        ? "CONTRIBUTION_ALLOCATION_TYPE_PENALTY"
        : "CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE") as CashAllocationType,
      targetId: charge.id,
      amount: amounts.charges[charge.id] ?? "",
    })),
    ...(shareAccountId
      ? [
          {
            type: "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE" as const,
            targetId: shareAccountId,
            amount: amounts.shares,
          },
        ]
      : []),
    ...Object.entries(amounts.loans).map(([targetId, amount]) => ({
      type: "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL" as const,
      targetId,
      amount,
    })),
  ];
  return rows.filter((row) => minorUnits(row.amount) > 0);
}

// formatMoney renders protobuf Money consistently in summaries and receipts.
export function formatMoney(money?: ShareMoney) {
  if (!money) return "Not available";
  const negative = (money.units || "0").startsWith("-") || money.nanos < 0;
  const units = (money.units || "0")
    .replace("-", "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = String(Math.abs(money.nanos || 0))
    .padStart(9, "0")
    .slice(0, 2);
  return `${money.currencyCode || "KES"} ${negative ? "-" : ""}${units}.${cents}`;
}

// formatDecimalMoney renders backend decimal strings without converting them to floats.
export function formatDecimalMoney(value: string) {
  const [units, fraction = ""] = value.split(".");
  return `KES ${units.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

// formatMinorUnits renders locally totalled integer cents.
export function formatMinorUnits(value: number) {
  const units = String(Math.floor(value / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
  return `KES ${units}.${String(value % 100).padStart(2, "0")}`;
}

// allocationLabel converts backend allocation enums into cashier-facing receipt labels.
export function allocationLabel(type: CashAllocationType) {
  const labels: Record<CashAllocationType, string> = {
    CONTRIBUTION_ALLOCATION_TYPE_COM: "COM",
    CONTRIBUTION_ALLOCATION_TYPE_LGOM: "LGOM",
    CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE: "Share purchase",
    CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL: "Loan repayment",
    CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE: "Assessed charge",
    CONTRIBUTION_ALLOCATION_TYPE_PENALTY: "Non-loan penalty",
  };
  return labels[type];
}

// moneyDecimal retains protobuf amounts as exact decimal inputs; removing it would require float conversion for quotes.
export function moneyDecimal(money: ShareMoney) {
  return `${money.units || "0"}.${String(money.nanos || 0)
    .padStart(9, "0")
    .slice(0, 2)}`;
}
