import { Building2, HeartHandshake, LockKeyhole, ShieldCheck } from "lucide-react";
import AuthTabs from "@/components/authTabs";

const AuthLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <main className="min-h-svh bg-[#f4f1ed] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-7xl overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(61,24,30,0.12)] sm:min-h-[calc(100svh-2.5rem)] lg:min-h-[calc(100svh-3rem)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative isolate overflow-hidden bg-[#7d1d2d] px-6 py-6 text-white sm:px-9 sm:py-8 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-[#a9384b]/55 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 -left-24 -z-10 size-96 rounded-full border-[70px] border-white/5"
          />

          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-[#7d1d2d] shadow-sm">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">Caritas</p>
              <p className="text-xs text-rose-100">Administration portal</p>
            </div>
          </div>

          <div className="mt-10 hidden max-w-lg lg:block">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">
              Staff workspace
            </p>
            <h2 className="text-4xl font-semibold leading-[1.12] tracking-[-0.035em] xl:text-5xl">
              One place to serve your members better.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-rose-100/85">
              Securely manage daily operations, financial services, and member
              support across every branch.
            </p>
          </div>

          <div className="mt-6 hidden grid-cols-2 gap-3 lg:grid">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <ShieldCheck className="mb-3 size-5 text-rose-100" />
              <p className="text-sm font-semibold">Secure access</p>
              <p className="mt-1 text-xs leading-5 text-rose-100/70">
                Protected staff authentication
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <Building2 className="mb-3 size-5 text-rose-100" />
              <p className="text-sm font-semibold">Branch operations</p>
              <p className="mt-1 text-xs leading-5 text-rose-100/70">
                A focused administrative workspace
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-[#fffdfb]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <LockKeyhole className="size-4 text-[#7d1d2d]" />
              Authorised staff only
            </div>
            <AuthTabs />
          </header>

          <div className="flex flex-1 items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-16">
            <div className="auth-page-animation w-full max-w-[29rem]">
              {children}
            </div>
          </div>

          <footer className="px-5 pb-5 text-center text-xs text-stone-400 sm:px-8 sm:pb-6">
            Caritas staff services · Secure administration
          </footer>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
