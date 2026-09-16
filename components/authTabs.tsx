"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Register" },
];

export default function AuthTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Authentication"
      className="flex items-center rounded-xl bg-stone-100 p-1"
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
              active
                ? "bg-white text-[#7d1d2d] shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
