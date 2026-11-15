import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import {Suspense} from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import AppSidebar from "../components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {Skeleton} from "@/components/ui/skeleton";
import {RouteLoadingStripe} from "../components/route-loading-stripe";
import { LoadingMessage } from "../components/loading-message";
import { goApiGet, GoApiError } from "@/lib/server/go-api";
import AccessDenied from "./access-denied";

// DashboardShellFallback provides a stable first frame while authentication resolves.
function DashboardShellFallback() {
  return (
    <div className="flex min-h-screen bg-[#faf9f7]" aria-busy="true" aria-label="Loading dashboard">
      <RouteLoadingStripe />
      <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white p-5 md:block">
        <Skeleton className="h-11 w-36" />
        <Skeleton className="mt-10 h-72 rounded-xl" />
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <div className="relative mx-auto max-w-7xl">
          <div className="space-y-6">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-40 rounded-2xl bg-rose-100" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <LoadingMessage message="Opening your workspace..." overlay />
        </div>
      </main>
    </div>
  );
}

// AuthenticatedDashboard keeps request-only session work behind a streaming boundary.
async function AuthenticatedDashboard({children}: {children: React.ReactNode}) {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }
  let staff: { permissions: string[] };
  try {
    staff = await goApiGet("/api/v1/auth/current-staff") as { permissions: string[] };
  } catch (error) {
    if (error instanceof GoApiError && error.status === 401) return <AccessDenied />;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Staff service unavailable</h1>
        <p>We could not check your staff access. Please try again.</p>
        <a className="text-[#7d1d2d] underline" href="/dashboard">Try again</a>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} permissions={staff.permissions ?? []} />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header user={session.user} />

        <section className="flex-1">{children}</section>

        <Footer />
      </main>
    </SidebarProvider>
  );
}

// DashboardLayout streams the authenticated shell without blocking the whole route.
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<DashboardShellFallback />}>
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}
