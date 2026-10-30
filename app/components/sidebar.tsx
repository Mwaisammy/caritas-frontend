"use client";

// import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {
  Banknote,
  BarChart3,
  FileText,
  HandCoins,
  HomeIcon,
  PiggyBank,
  ShieldCheck,
  ShieldUser,
  Users,
  Wallet,
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
import Image from "next/image";
const mainMenu = [
  {
    title: "Dashboard",
    href: "/dashboard/main",
    icon: HomeIcon,
  },
  {
    title: "Members",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Cash Contributions",
    href: "/dashboard/contributions",
    icon: Banknote,
  },
  {
    title: "Shares",
    href: "/dashboard/shares",
    icon: PiggyBank,
  },
  {
    title: "Loans",
    href: "/dashboard/loans",
    icon: HandCoins,
  },
  {
    title: "Dividends",
    href: "/dashboard/dividends",
    icon: Wallet,
  },
  {
    title: "Staff Console",
    href: "/dashboard/staff",
    icon: ShieldCheck,
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

export default function AppSidebar({user}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r bg-white">
      {/* Header */}
      <SidebarHeader className="flex mr-auto border-b px-3">
        <Image
          src={
            "https://res.cloudinary.com/dbl2bdg1v/image/upload/v1793372215/caritas-logo_ref7qu.png"
          }
          alt="Caritas Sagana"
          width={500}
          height={300}
          className="w-[240px] h-auto object-contain -ml-3"
          priority
        />
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
                      style={{margin: "0.1rem 0rem"}}
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
