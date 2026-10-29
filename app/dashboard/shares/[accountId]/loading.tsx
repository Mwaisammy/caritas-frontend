import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";
import {Skeleton} from "@/components/ui/skeleton";

// ShareAccountLoading gives this segment a streaming boundary so fresh account reads do not block navigation.
export default function ShareAccountLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div
        aria-busy="true"
        aria-label="Loading share account"
        className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"
        role="status"
      >
        <span className="sr-only">Loading share account…</span>
        <div
          aria-hidden="true"
          className="mx-auto flex max-w-7xl flex-col gap-6"
        >
          <div className="flex flex-col gap-5 rounded-2xl border bg-card px-6 py-6 sm:px-8">
            <Skeleton className="h-5 w-32" />
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-9 w-56 max-w-full" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-14 w-80 max-w-full rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((card) => (
              <div
                key={card}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
              >
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {[0, 1].map((chart) => (
              <div
                key={chart}
                className="flex flex-col gap-6 rounded-2xl border bg-card p-5"
              >
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-52 w-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
