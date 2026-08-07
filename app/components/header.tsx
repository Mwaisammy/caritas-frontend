import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, User } from "lucide-react";
import React from "react";
import UserDropdown from "./user";

const Header = () => {
  return (
    <nav className=" text-black   p-6">
      <header className="flex justify-between items-center gap-4">
        <h1 className="text-sm sm:text-xl md:text-2xl font-bold">Dashboard</h1>

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
                <UserDropdown />
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
