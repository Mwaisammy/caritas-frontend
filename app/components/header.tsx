"use client";

import { Separator } from "@/components/ui/separator";
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
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  return (
    <nav className=" text-black   p-6">
      <header className="flex justify-between items-center gap-4">
        <h1 className="text-sm sm:text-xl md:text-2xl font-bold">{title}</h1>

        <div>
          <nav className="flex justify-center items-center gap-4">
            <ul className="flex items-center gap-4">
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
          </nav>
        </div>
      </header>
      <Separator className="my-4" />
    </nav>
  );
};

export default Header;
