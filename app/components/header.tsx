import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, User } from "lucide-react";
import React from "react";

const Header = () => {
  return (
    <nav className=" text-black bg-rose-200 p-4">
      <header className="flex justify-between items-center gap-4">
        <h1 className="text-sm sm:text-xl md:text-2xl font-bold">Dashboard</h1>

        <div>
          <nav className="">
            <ul className="flex justify-center align-middle bg-rose-200 px-4 gap-4">
              <li>
                <Bell className="size-3 md:size-4" />
              </li>
              <li>
                <MessageSquare className="size-3 md:size-4" />
              </li>
              <li>
                <User className="size-3 md:size-4" />
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
