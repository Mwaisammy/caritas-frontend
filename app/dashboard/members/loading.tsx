import { RouteLoadingStripe } from "@/app/components/route-loading-stripe";
// import { LoadingMessage } from "@/app/components/loading-message";
import { Skeleton } from "@/components/ui/skeleton";

// MembersLoading holds the directory layout steady while records stream in.
export default function MembersLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
        <div className="relative mx-auto max-w-7xl" aria-busy="true">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl bg-stone-200" />
            <Skeleton className="h-20 rounded-2xl bg-stone-200" />
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6">
              <Skeleton className="mb-6 h-7 w-48 rounded bg-stone-200" />
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    className="h-14 w-full rounded bg-stone-100"
                    key={index}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* <LoadingMessage message="Gathering the member directory..." overlay /> */}
        </div>
      </div>
    </>
  );
}
