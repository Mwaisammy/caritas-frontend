"use client";

// import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  HandCoins,
  PiggyBank,
  Wallet,
  Users,
  BarChart3,
  FileText,
  Search,
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
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Loans",
    href: "/loans",
    icon: HandCoins,
  },
  {
    title: "Shares",
    href: "/shares",
    icon: PiggyBank,
  },
  {
    title: "Dividends",
    href: "/dividends",
    icon: Wallet,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
];

const reports = [
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },
];

export default function AppSidebar() {
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
            SM
          </div>

          <div>
            <p className="font-semibold text-gray-900">Samuel Mwai</p>
            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
