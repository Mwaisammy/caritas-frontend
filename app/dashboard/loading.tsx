import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";
import {Skeleton} from "@/components/ui/skeleton";

// DashboardLoading keeps the existing shell visible while a destination streams in.
export default function DashboardLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
        <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading page">
          <Skeleton className="h-40 rounded-2xl bg-rose-100" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </>
  );
}
