import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {Suspense} from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import AppSidebar from "../components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {Skeleton} from "@/components/ui/skeleton";
import {RouteLoadingStripe} from "../components/route-loading-stripe";

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
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl bg-rose-100" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

// AuthenticatedDashboard keeps request-only session work behind a streaming boundary.
async function AuthenticatedDashboard({children}: {children: React.ReactNode}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />

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
