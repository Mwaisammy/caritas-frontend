import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";
import { LoadingMessage } from "@/app/components/loading-message";
import { Skeleton } from "@/components/ui/skeleton";

// SharesLoading keeps the dashboard stable while account data is fetched from the service.
export default function SharesLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
        <div className="relative mx-auto max-w-7xl" aria-busy="true">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl bg-stone-200" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton className="h-32 rounded-2xl bg-stone-200" key={item} />
              ))}
            </div>
            <Skeleton className="h-96 rounded-2xl bg-stone-200" />
          </div>
          <LoadingMessage message="Getting your share accounts ready..." overlay />
        </div>
      </div>
    </>
  );
}
