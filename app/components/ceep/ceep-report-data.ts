import { z } from "zod";

const amount = z.string().regex(/^-?\d+(\.\d+)?$/);
const amounts = z.object({
  com: amount,
  previousShares: amount,
  sharesPaid: amount,
  totalShares: amount,
  lgom: amount,
  literature: amount,
  registration: amount,
  groupRegistration: z.literal("0").default("0"),
  lsf: amount,
  principalDisbursed: amount,
  loanPaid: amount,
  loanBalance: amount,
  interest: amount,
  loanBalanceAfterPay: amount,
  laptop: amount,
  penalty: amount,
  totalAmt: amount,
});

// Provisional Struct mapping: the local backend has no CEEP implementation to confirm these keys.
// Validate every handled amount so an incompatible response cannot silently display missing money as zero.
export const ceepReportSchema = z.object({
  period: z.iso.date(),
  cutoff: z.iso.datetime({ offset: true }),
  generatedAt: z.iso.datetime({ offset: true }),
  paymentDate: z.union([z.iso.date(), z.literal("")]).default(""),
  title: z.string(),
  parish: z.string(),
  status: z.enum(["draft", "finalized"]),
  previewHash: z.string().default(""),
  rows: z.array(amounts.extend({
    recNo: z.string().min(1),
    memberNo: z.string().regex(/^\d+$/),
    fullName: z.string(),
  })),
  totals: amounts,
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
  ["loanPaid", "Monthly loan paid"],
  ["loanBalance", "Loan balance"],
  ["interest", "Interest 1%"],
  ["loanBalanceAfterPay", "Loan balance after pay"],
  ["laptop", "Laptop"],
  ["penalty", "Penalty"],
  ["totalAmt", "Total Amt"],
] as const;

// Decimal-text rounding avoids losing ledger precision through Number conversion; stored values are never changed.
export function ceepAmount(value: string) {
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
    .sort((a, b) => BigInt(a.memberNo) < BigInt(b.memberNo) ? -1 : BigInt(a.memberNo) > BigInt(b.memberNo) ? 1 : 0)
    .map((row) => [
      row.recNo,
      row.memberNo.padStart(3, "0"),
      row.fullName,
      ...ceepAmountColumns.map(([key]) => ceepAmount(row[key])),
    ]);
}
