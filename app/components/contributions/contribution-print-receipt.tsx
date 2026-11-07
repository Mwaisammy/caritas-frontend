import Image from "next/image";
import type { ShareMoney } from "@/lib/go-api-client";
import { formatMoney } from "./contribution-utils";

// ReceiptLine keeps contribution and loan amounts in the same two-column print layout.
type ReceiptLine = {
  key?: string;
  label: string;
  value: string;
  highlight?: boolean;
};

// amountWords formats the receipt total in words without floating-point arithmetic.
function amountWords(value: bigint): string {
  const small = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  if (value < BigInt(20)) return small[Number(value)];
  if (value < BigInt(100)) {
    return (
      [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ][Number(value / BigInt(10))] +
      (value % BigInt(10) ? ` ${amountWords(value % BigInt(10))}` : "")
    );
  }

  for (const [scale, label] of [
    [BigInt("1000000000000"), "Trillion"],
    [BigInt(1_000_000_000), "Billion"],
    [BigInt(1_000_000), "Million"],
    [BigInt(1_000), "Thousand"],
    [BigInt(100), "Hundred"],
  ] as const) {
    if (value >= scale) {
      return `${amountWords(value / scale)} ${label}${
        value % scale ? ` ${amountWords(value % scale)}` : ""
      }`;
    }
  }

  return "";
}

// ContributionPrintReceipt gives cash and M-Pesa the same printable layout and paper styling.
export function ContributionPrintReceipt({
  receiptNumber,
  memberNumber,
  memberName,
  period,
  receivedOn,
  paymentMethod,
  paymentDetailLabel,
  paymentDetail,
  amount,
  contributionRows,
  loanRows,
  notice,
}: {
  receiptNumber: string;
  memberNumber: string;
  memberName: string;
  period: string;
  receivedOn: string;
  paymentMethod: string;
  paymentDetailLabel: string;
  paymentDetail: string;
  amount: ShareMoney;
  contributionRows: ReceiptLine[];
  loanRows: ReceiptLine[];
  notice?: string;
}) {
  const total = formatMoney(amount).replace(/^KES /, "");
  const columnsFor = (rows: ReceiptLine[]) =>
    Math.min(4, Math.max(1, Math.ceil(rows.length / 8)));
  const rowCount = Math.max(contributionRows.length, loanRows.length);
  const density =
    rowCount > 24 ? "tight" : rowCount > 12 ? "compact" : "normal";
  const amountInWords = `${amountWords(BigInt(amount.units || "0"))} shillings and ${amountWords(
    BigInt(Math.floor((amount.nanos || 0) / 10_000_000)),
  )} cents`;

  return (
    <article
      className="cash-receipt"
      data-density={density}
      aria-label={`${paymentMethod} contribution receipt`}
    >
      <header className="receipt-heading">
        <Image
          src="/caritas-logo.png"
          alt="Caritas Sagana parish logo"
          width={180}
          height={108}
          className="receipt-logo receipt-logo-left"
        />
        <div className="receipt-heading-copy">
          <h1>Our Lady of Consolata Sagana Kabiru-ini Parish</h1>
          <p>P.O. BOX 1004 KARATINA</p>
        </div>
        <Image
          src="/caritas-logo.png"
          alt="Caritas Sagana logo"
          width={180}
          height={108}
          className="receipt-logo receipt-logo-right"
        />
      </header>

      <dl className="receipt-member">
        <div>
          <dt>Receipt No:</dt>
          <dd>{receiptNumber}</dd>
        </div>
        <div>
          <dt>Member No:</dt>
          <dd>{memberNumber}</dd>
        </div>
        <div>
          <dt>Name:</dt>
          <dd>{memberName}</dd>
        </div>
        <div>
          <dt>For the month:</dt>
          <dd>{period}</dd>
        </div>
        <div>
          <dt>Received on:</dt>
          <dd>{receivedOn}</dd>
        </div>
      </dl>

      {notice ? <p className="receipt-notice">{notice}</p> : null}

      <div className="receipt-columns">
        <section aria-label="Contribution details">
          <h2 className="receipt-column-heading">
            <span>BEING PAID FOR</span>
            <span>AMOUNT (KES)</span>
          </h2>
          <div
            className="receipt-lines"
            data-columns={columnsFor(contributionRows)}
          >
            {contributionRows.map((row) => (
              <div
                className={`receipt-line${row.highlight ? " receipt-line-highlight" : ""}`}
                key={row.key ?? row.label}
              >
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Loan details">
          <h2 className="receipt-column-heading">
            <span>LOAN DETAILS</span>
            <span>AMOUNT (KES)</span>
          </h2>
          <div className="receipt-lines" data-columns={columnsFor(loanRows)}>
            {loanRows.map((row) => (
              <div className="receipt-line" key={row.key ?? row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
          <div className="receipt-total">
            <strong>TOTAL AMOUNT PAID</strong>
            <strong>{total}</strong>
          </div>
        </section>
      </div>

      <p className="receipt-words">
        <strong>Amount in words: </strong>
        {amountInWords}
      </p>

      <footer className="receipt-footer">
        <p>
          Payment method<strong>{paymentMethod}</strong>
        </p>
        <p>
          {paymentDetailLabel}
          <strong>{paymentDetail}</strong>
        </p>
        <p>
          Date<strong>{receivedOn}</strong>
        </p>
      </footer>

      <div className="receipt-signoff">
        <div className="receipt-signature">SIGNATURE</div>
        <div className="receipt-stamp">STAMP</div>
      </div>
    </article>
  );
}
