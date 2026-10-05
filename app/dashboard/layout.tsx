import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Footer from "../components/footer";
import Header from "../components/header";
import AppSidebar from "../components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
