import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";

// MembersLoading holds the directory layout steady while records stream in.
export default function MembersLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-40 rounded-2xl bg-stone-200" />
          <div className="h-20 rounded-2xl bg-stone-200" />
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6">
            <div className="mb-6 h-7 w-48 rounded bg-stone-200" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="h-14 w-full rounded bg-stone-100" key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
