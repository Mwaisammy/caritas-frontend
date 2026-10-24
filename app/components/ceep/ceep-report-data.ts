import { z } from "zod";

const amount = z.string().regex(/^-?\d+(\.\d{1,4})?$/);
const amounts = z.object({
  com: amount,
  previousShares: amount.nullable(),
  sharesPaid: amount,
  totalShares: amount.nullable(),
  lgom: amount,
  literature: amount,
  registration: amount,
  groupRegistration: amount.nullable().transform((value) => value ?? "0"),
  lsf: amount,
  principalDisbursed: amount.nullable(),
  principalPaid: amount,
  loanBalance: amount.nullable(),
  interestAssessed: amount.nullable(),
  closingPrincipal: amount.nullable(),
  laptop: amount,
  penalty: amount,
  totalPaid: amount,
});

// Matches caritas/internal/ceepdb/queries.sql; missing ledger history stays distinct from zero payments.
export const ceepReportSchema = z.object({
  period: z.iso.date(),
  cutoff: z.iso.datetime({ offset: true }),
  generatedAt: z.iso.datetime({ offset: true }),
  paymentDate: z.union([z.iso.date(), z.literal("")]).default(""),
  title: z.string(),
  parish: z.string(),
  status: z.enum(["draft", "finalized"]),
  previewHash: z.string().default(""),
  canFinalize: z.boolean(),
  hasErrors: z.boolean(),
  rows: z.array(amounts.extend({
    recNo: z.string().min(1),
    memberNumber: z.string().regex(/^\d+$/),
    fullName: z.string(),
  })),
});

// CEEPReport keeps the workspace and table on the same validated contract; separate types could drift.
export type CEEPReport = typeof ceepReportSchema._output;

// This single ordered list keeps screen, print and CSV columns identical.
export const ceepAmountColumns = [
  ["com", "COM"],
  ["previousShares", "Previous shares"],
  ["sharesPaid", "Shares paid"],
  ["totalShares", "T. shares"],
  ["lgom", "LGOM"],
  ["literature", "Sale of literature"],
  ["registration", "CARITAS registration"],
  ["groupRegistration", "Group registration"],
  ["lsf", "LSF"],
  ["principalDisbursed", "Principal loan disbursed"],
  ["principalPaid", "Monthly loan paid"],
  ["loanBalance", "Loan balance"],
  ["interestAssessed", "Interest 1%"],
  ["closingPrincipal", "Loan balance after pay"],
  ["laptop", "Laptop"],
  ["penalty", "Penalty"],
  ["totalPaid", "Total Amt"],
] as const;

// Decimal-text rounding avoids losing ledger precision through Number conversion; stored values are never changed.
export function ceepAmount(value: string | null) {
  if (value === null) return "Unavailable";
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const digits = fraction.padEnd(3, "0");
  const cents = BigInt(whole) * BigInt(100) + BigInt(digits.slice(0, 2))
    + (digits[2] >= "5" ? BigInt(1) : BigInt(0));
  const decimal = (cents % BigInt(100)).toString().padStart(2, "0").replace(/0+$/, "");
  return `${negative && cents !== BigInt(0) ? "-" : ""}${(cents / BigInt(100)).toLocaleString("en-KE")}${decimal ? `.${decimal}` : ""}`;
}

// Both exports use the same formatted cells; saved report references are preserved and member numbers remain text.
export function ceepRows(report: CEEPReport) {
  return [...report.rows]
    .sort((a, b) => BigInt(a.memberNumber) < BigInt(b.memberNumber) ? -1 : BigInt(a.memberNumber) > BigInt(b.memberNumber) ? 1 : 0)
    .map((row) => [
      row.recNo,
      row.memberNumber.padStart(3, "0"),
      row.fullName,
      ...ceepAmountColumns.map(([key]) => ceepAmount(row[key])),
    ]);
}

// The backend supplies rows, not totals. Sum all four stored decimal places before display rounding;
// a column with missing history cannot have a trustworthy total.
export function ceepTotals(report: CEEPReport) {
  return ceepAmountColumns.map(([key]) => {
    const values = report.rows.map((row) => row[key]);
    if (values.some((value) => value === null)) return "Unavailable";
    const total = values.reduce((sum, value) => {
      const [whole, fraction = ""] = value!.split(".");
      return sum + BigInt(`${whole}${fraction.padEnd(4, "0")}`);
    }, BigInt(0));
    const absolute = total < BigInt(0) ? -total : total;
    return ceepAmount(`${total < BigInt(0) ? "-" : ""}${absolute / BigInt(10000)}.${(absolute % BigInt(10000)).toString().padStart(4, "0")}`);
  });
}
