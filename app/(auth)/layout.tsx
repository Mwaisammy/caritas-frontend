"use client";
import Image from "next/image";
import React from "react";
import AuthImage from "../../public/caritas-auth.jpg";
import AuthTabs from "@/components/authTabs";
import { usePathname } from "next/navigation";

const AuthLayout = ({ children }: React.PropsWithChildren) => {
  const pathName = usePathname();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen py-4 px-3 ">
      <div className="flex flex-col justify-center    overflow-hidden w-full max-w-md mx-auto p-4 ">
        {/* Page content animation */}

        <div className="fixed top-80 w-full flex justify-between items-center">
          <AuthTabs />
        </div>
        <div key={pathName} className="auth-page-animation mt-6">
          {children}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Image
          src={AuthImage}
          width={500}
          height={800}
          alt="hero"
          className="w-50 h-70 sm:w-80 sm:h-100 md:w-100 md:h-130 lg:w-120 lg:h-160  object-cover"
        />
      </div>
    </div>
  );
};

export default AuthLayout;
