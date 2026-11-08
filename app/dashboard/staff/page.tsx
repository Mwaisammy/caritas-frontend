import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import StaffTestCard from "../staff-test-card";

// StaffContent resolves the signed-in identity inside the streaming boundary.
async function StaffContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <StaffTestCard currentAuthUserId={session?.user.id ?? ""} />;
}

// StaffConsolePage provides a stable shell while the session lookup completes.
export default function StaffConsolePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" aria-label="Loading staff access">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
      >
        <StaffContent />
      </Suspense>
    </div>
  );
}
