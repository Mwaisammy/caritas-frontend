import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const safeCallbackUrl = (callbackUrl?: string) => {
  if (!callbackUrl?.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  return callbackUrl;
};

// LoginContent keeps request-bound session and callback reads inside Suspense.
const LoginContent = async ({ searchParams }: LoginPageProps) => {
  const session = await auth.api.getSession({ headers: await headers() });
  const { callbackUrl } = await searchParams;
  const destination = safeCallbackUrl(callbackUrl);

  if (session) {
    redirect(destination);
  }

  return (
    <div className="w-full">
      <div>
        <p className="text-sm font-semibold text-[#9c2c40]">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-stone-950 sm:text-4xl">
          Sign in to your account
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500 sm:text-base">
          Enter your staff credentials to continue to the administration
          workspace.
        </p>
      </div>
      <LoginForm callbackUrl={destination} />
    </div>
  );
};

// Login streams a stable placeholder while the session redirect is resolved.
const Login = ({ searchParams }: LoginPageProps) => (
  <Suspense fallback={<p className="text-sm text-stone-500">Opening sign in…</p>}>
    <LoginContent searchParams={searchParams} />
  </Suspense>
);

export default Login;
