"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import UserDropdown from "./user";

type HeaderProps = {
  user: {
    email: string;
    name: string;
  };
};

const routeTitles: Record<string, string> = {
  main: "Dashboard",
  loans: "Loans",
  shares: "Shares",
  dividends: "Dividends",
  members: "Members",
  users: "Users",
  ceep: "CEEP",
  analytics: "Analytics",
  reports: "Reports",
};

function titleFromPath(pathname: string) {
  const section = pathname.split("/").filter(Boolean)[1];
  if (!section) return "Dashboard";

  return routeTitles[section] ?? section
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const Header = ({ user }: HeaderProps) => {
  const section = usePathname().split("/")[2] || "main";
  const title =
    section === "main"
      ? "Dashboard"
      : section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-white/95 px-4 py-4 text-black backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <h1 className="truncate text-sm font-bold sm:text-xl md:text-2xl">
          {title}
        </h1>
      </div>

      <ul className="flex shrink-0 items-center gap-4">
        <li>
          <Bell className="size-3 md:size-4" />
        </li>
        <li>
          <MessageSquare className="size-3 md:size-4" />
        </li>
        <li>
          <UserDropdown user={user} />
        </li>
      </ul>
    </header>
  );
};

export default Header;
