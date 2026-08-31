"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthTabs() {
  const pathName = usePathname();

  const isLogin = pathName === "/login";
  const isSignUp = pathName === "/signup";

  return (
    <div className="ml-4 flex items-center gap-2">
      <Link
        href="/login"
        className={`rounded-md px-4 py-2  font-medium transition-all duration-300 text-xs md:text-sm ${
          isLogin
            ? "bg-rose-800 text-white shadow-sm"
            : "text-gray-500 hover:text-black"
        }} `}
      >
        Login
      </Link>

      <Link
        href="/signup"
        className={`rounded-md px-4 py-2  font-medium transition-all duration-300 text-xs md:text-sm ${
          isSignUp
            ? "bg-rose-800 text-white shadow-sm"
            : "text-gray-500 hover:text-black"
        }`}
      >
        Sign Up
      </Link>
    </div>
  );
}
