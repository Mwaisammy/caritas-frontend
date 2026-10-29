import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";
import { LoadingMessage } from "@/app/components/loading-message";
import { Skeleton } from "@/components/ui/skeleton";

// LoansLoading keeps the dashboard stable while loan data is fetched.
export default function LoansLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
        <div className="relative mx-auto max-w-7xl" aria-busy="true">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl bg-stone-200" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton className="h-28 rounded-2xl bg-stone-200" key={item} />
              ))}
            </div>
            <Skeleton className="h-80 rounded-2xl bg-stone-200" />
          </div>
          <LoadingMessage message="Gathering your loan information..." overlay />
        </div>
      </div>
    </>
  );
}
