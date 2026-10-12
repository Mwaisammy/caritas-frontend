import type { LoanStatus } from "@/lib/go-api-client";

interface StatusBadgeProps {
  status: LoanStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<LoanStatus, string> = {
    LOAN_STATUS_UNSPECIFIED: "bg-gray-100 text-gray-700",
    LOAN_STATUS_PENDING: "bg-yellow-100 text-yellow-700",
    LOAN_STATUS_APPROVED: "bg-green-100 text-green-700",
    LOAN_STATUS_REJECTED: "bg-red-100 text-red-700",
    LOAN_STATUS_DISBURSED: "bg-blue-100 text-blue-700",
    LOAN_STATUS_ACTIVE: "bg-blue-100 text-blue-700",
    LOAN_STATUS_DELINQUENT: "bg-orange-100 text-orange-700",
    LOAN_STATUS_CLOSED: "bg-gray-100 text-gray-700",
    LOAN_STATUS_WRITTEN_OFF: "bg-gray-200 text-gray-700",
    LOAN_STATUS_RESTRUCTURING: "bg-purple-100 text-purple-700",
    LOAN_STATUS_MANUAL_REVIEW: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status.replace("LOAN_STATUS_", "").replaceAll("_", " ")}
    </span>
  );
}
