import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";
import {Skeleton} from "@/components/ui/skeleton";
import { LoadingMessage } from "@/app/components/loading-message";

// DashboardLoading keeps the existing shell visible while a destination streams in.
export default function DashboardLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
        <div className="relative mx-auto max-w-7xl" aria-busy="true" aria-label="Loading page">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl bg-rose-100" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <LoadingMessage message="Putting your dashboard together..." overlay />
        </div>
      </div>
    </>
  );
}
