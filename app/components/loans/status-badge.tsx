import type { LoanStatus } from "../../types/loans";

interface StatusBadgeProps {
  status: LoanStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<LoanStatus, string> = {
    Approved: "bg-green-100 text-green-700",
    Active: "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
