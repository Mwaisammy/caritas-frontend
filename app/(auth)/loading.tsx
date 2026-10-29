import { RouteLoadingStripe } from "@/app/components/route-loading-stripe";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingMessage } from "@/app/components/loading-message";

// AuthLoading mirrors the form footprint while session and URL state resolve.
export default function AuthLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div
        className="relative w-full"
        aria-busy="true"
        aria-label="Loading authentication page"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full bg-rose-100" />
          </div>
        </div>
        {/* <LoadingMessage message="Getting sign-in ready..." overlay /> */}
      </div>
    </>
  );
}
