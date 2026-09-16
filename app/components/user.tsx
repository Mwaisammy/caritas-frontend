"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOutIcon,
  UserIcon,
} from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type UserDropdownProps = {
  user: {
    email: string;
    name: string;
  };
};

const UserDropdown = ({ user }: UserDropdownProps) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="cursor-pointer rounded-full p-4"
          render={
            <Button
              variant="outline"
              className=" cursor-pointer rounded-full p-4"
            >
              <UserIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-56">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} variant="destructive">
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserDropdown;
