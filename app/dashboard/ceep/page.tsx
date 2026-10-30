import {connection} from "next/server";
import {CeepReport} from "@/app/components/ceep/ceep-report";
import {Suspense} from "react";
import DashboardLoading from "../loading";

// Request-time Nairobi dates prevent a cached page from offering yesterday's reporting month.
async function CeepContent() {
  await connection();
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = month.find((part) => part.type === "year")!.value;
  const number = month.find((part) => part.type === "month")!.value;
  const previous = new Date(Date.UTC(Number(year), Number(number) - 2, 1));

  return (
    <CeepReport
      initialMonth={previous.toISOString().slice(0, 7)}
      currentMonth={`${year}-${number}`}
    />
  );
}

// CeepPage gives client navigation a fallback before request-time dates are read.
export default function CeepPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CeepContent />
    </Suspense>
  );
}
