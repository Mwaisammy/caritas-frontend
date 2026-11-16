"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// AccessDenied lets a revoked staff member clear their still valid Better Auth session.
export default function AccessDenied() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Staff access deactivated</h1>
      <p>Your staff access has been deactivated. Contact an administrator.</p>
      <button
        className="rounded-lg bg-[#7d1d2d] px-4 py-2 text-white"
        onClick={async () => {
          await authClient.signOut();
          router.replace("/login");
          router.refresh();
        }}
        type="button"
      >
        Sign out
      </button>
    </main>
  );
}
