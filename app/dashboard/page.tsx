"use client";

import { LoaderCircle } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

// DashboardIndex keeps existing sign-in links pointed at the main dashboard.
export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/main");
  }, [router]);

  return (
    <div className="flex flex-col gap-4 min-h-screen items-center justify-center">
      <LoaderCircle className="size-8 animate-spin text-[#7d1d2d]" />

      <p className="text-sm font-medium text-stone-600">
        Redirecting to your dashboard...
      </p>
    </div>
  );
}
