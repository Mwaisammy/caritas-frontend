import { ChevronRight, MoreHorizontal } from "lucide-react";

// import { applications } from "../../data/loans";
// import { StatusBadge } from "./status-badge";

export function RecentApplications() {
  return (
    <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Loan Applications</h2>

        <button className="flex items-center gap-1 text-xs font-semibold text-[#c51f25]">
          View all
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Member</th>

              <th className="px-4 py-3 font-medium">Loan ID</th>

              <th className="px-4 py-3 font-medium">Amount</th>

              <th className="px-4 py-3 font-medium">Term</th>

              <th className="px-4 py-3 font-medium">Status</th>

              <th className="px-4 py-3 font-medium">Applied Date</th>

              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>

          {/* <tbody>
            {applications.map((application) => (
              <tr
                key={application.id}
                className="border-t border-gray-100 text-sm"
              >
                <td className="px-4 py-3 font-medium">{application.name}</td>

                <td className="px-4 py-3 text-gray-500">{application.id}</td>

                <td className="px-4 py-3">{application.amount}</td>

                <td className="px-4 py-3 text-gray-500">{application.term}</td>

                <td className="px-4 py-3">
                  <StatusBadge status={application.status} />
                </td>

                <td className="px-4 py-3 text-gray-500">{application.date}</td>

                <td className="px-4 py-3 text-center">
                  <button className="rounded-md p-1.5 hover:bg-gray-100">
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody> */}
        </table>
      </div>
    </section>
  );
}
