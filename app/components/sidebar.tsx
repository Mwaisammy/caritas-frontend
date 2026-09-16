"use client";

// import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  // LayoutDashboard,
  HandCoins,
  PiggyBank,
  Wallet,
  Users,
  BarChart3,
  FileText,
  Search,
  ShieldUser,
  HomeIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainMenu = [
  {
    title: "Dashboard",
    href: "/dashboard/main",
    icon: HomeIcon,
  },
  {
    title: "Loans",
    href: "/dashboard/loans",
    icon: HandCoins,
  },
  {
    title: "Shares",
    href: "/dashboard/shares",
    icon: PiggyBank,
  },
  {
    title: "Dividends",
    href: "/dashboard/dividends",
    icon: Wallet,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Ceep",
    href: "/dashboard/ceep",
    icon: ShieldUser,
  },
];

const reports = [
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
];

type AppSidebarProps = {
  user: {
    email: string;
    name: string;
  };
};

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CA";

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r bg-white">
      {/* Header */}
      <SidebarHeader className="border-b px-5 py-6">
        {/* <Image
          src="/caritas-logo.png"
          alt="Caritas"
          width={180}
          height={60}
          priority
        /> */}
        LOGO
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-red-800 focus:outline-none"
          />
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenu.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      style={{ margin: "0.1rem 0rem" }}
                      className={
                        active
                          ? "bg-red-800 text-white hover:bg-red-800"
                          : "hover:bg-red-800 hover:text-white"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {reports.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      className={
                        active
                          ? "bg-red-800 text-white hover:bg-red-800"
                          : "hover:bg-red-50 hover:text-red-800"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-red-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-800 font-semibold text-white">
            {initialsFor(user.name)}
          </div>

          <div>
            <p className="max-w-40 truncate font-semibold text-gray-900">
              {user.name}
            </p>
            <p className="max-w-40 truncate text-sm text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
