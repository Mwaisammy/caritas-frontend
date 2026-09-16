import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

const Login = async ({ searchParams }: LoginPageProps) => {
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

export default Login;
