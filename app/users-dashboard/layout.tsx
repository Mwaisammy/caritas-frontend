import { SidebarProvider } from "@/components/ui/sidebar";
import UserSidebar from "@/components/ui/userSidebar";
import React from "react";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SidebarProvider>
        <UserSidebar />
        {children}
      </SidebarProvider>
    </div>
  );
};

export default UserLayout;
