import {Banknote, HandCoins, PiggyBank, Users} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const services = [
  {title: "Members", description: "Member records and status", icon: Users},
  {
    title: "Contributions",
    description: "Cash and M-Pesa collection",
    icon: Banknote,
  },
  {
    title: "Shares",
    description: "Accounts and transactions",
    icon: PiggyBank,
  },
  {
    title: "Loans",
    description: "Applications and repayments",
    icon: HandCoins,
  },
];

// Home is the public entry point for Caritas staff sign-in and registration.
export default function Home() {
  return (
    <main className="min-h-svh bg-[#f4f1ed] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(61,24,30,0.12)] sm:min-h-[calc(100svh-2.5rem)] lg:min-h-[calc(100svh-3rem)]">
        <header className="border-b border-stone-200 px-5 py-4 sm:px-8">
          <Image
            src="https://res.cloudinary.com/dbl2bdg1v/image/upload/v1793372215/caritas-logo_ref7qu.png"
            alt="Caritas Sagana"
            width={180}
            height={108}
            className="h-auto w-36 object-contain sm:w-44"
            priority
          />
        </header>

        <div className="grid flex-1 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative flex flex-col justify-center bg-[#7d1d2d] px-6 py-12 text-white sm:px-10 lg:px-14">
            <Image
              src="https://res.cloudinary.com/dbl2bdg1v/image/upload/v1793372220/village-meeting-2_jbhfsg.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              fetchPriority="high"
            />
            {/* dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 ">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">
                Authorized staff only
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Caritas Staff Portal
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-rose-100/90">
                Securely manage member services and daily branch operations in
                one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[#7d1d2d] hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href="/login"
                >
                  Sign in
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/35 px-5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href="/signup"
                >
                  Create staff account
                </Link>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
            <h2 className="text-lg font-semibold text-stone-950">
              Staff services
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Your workspace brings these day-to-day tasks together.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {services.map(({title, description, icon: Icon}) => (
                <div
                  className="rounded-xl border border-stone-200 bg-[#fffdfb] p-4"
                  key={title}
                >
                  <Icon aria-hidden="true" className="size-5 text-[#9c2c40]" />
                  <h3 className="mt-3 text-sm font-semibold text-stone-900">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-stone-200 px-5 py-4 text-center text-xs text-stone-500 sm:px-8">
          Caritas Admin - Sagana Branch
        </footer>
      </div>
    </main>
  );
}
