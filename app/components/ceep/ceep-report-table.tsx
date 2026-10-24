import { ceepAmount, ceepAmountColumns, ceepRows, type CEEPReport } from "./ceep-report-data";
import { cn } from "@/lib/utils";

// One table is used on screen and in print, preventing differences between the reviewed and printed report.
export function CeepReportTable({ report }: { report: CEEPReport }) {
  const headings = ["RecNo", "M.NO", "Full name", ...ceepAmountColumns.map(([, label]) => label)];

  return (
    <div className="ceep-table-scroll max-h-[70vh] overflow-auto rounded-lg border print:max-h-none print:overflow-visible print:rounded-none">
      <table className="ceep-table w-full border-collapse text-xs tabular-nums">
        <caption className="sr-only">Monthly CEEP report for {report.period.slice(0, 7)}. All amounts in KES.</caption>
        <thead className="sticky top-0 z-20 bg-muted print:static">
          <tr>
            {headings.map((heading, index) => (
              <th key={heading} scope="col" className={cn(
                "min-w-24 border-b px-3 py-3 text-right align-bottom font-medium",
                index < 3 && "text-left",
                index === 1 && "sticky left-0 z-10 min-w-16 bg-muted",
                index === 2 && "sticky left-16 z-10 min-w-48 bg-muted",
              )}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ceepRows(report).map((cells) => (
            <tr key={cells[0]} className="group border-b last:border-0 hover:bg-muted/30">
              {cells.map((cell, index) => (
                <td key={headings[index]} className={cn(
                  "whitespace-nowrap px-3 py-3 text-right",
                  index < 3 && "text-left",
                  index === 1 && "sticky left-0 bg-card group-hover:bg-muted",
                  index === 2 && "sticky left-16 bg-card group-hover:bg-muted",
                )}>{cell}</td>
              ))}
            </tr>
          ))}
          {report.rows.length === 0 && (
            <tr><td colSpan={headings.length} className="p-8 text-center text-muted-foreground">No members in this report.</td></tr>
          )}
        </tbody>
        <tfoot className="border-t bg-muted/50 font-medium">
          <tr>
            <th colSpan={3} scope="row" className="px-3 py-3 text-left">Totals</th>
            {ceepAmountColumns.map(([key]) => <td key={key} className="whitespace-nowrap px-3 py-3 text-right">{ceepAmount(report.totals[key])}</td>)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
