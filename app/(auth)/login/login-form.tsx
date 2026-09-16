"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type LoginFormProps = {
  callbackUrl: string;
};

const LoginForm = ({ callbackUrl }: LoginFormProps) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const rememberMe = formData.get("rememberMe") === "on";

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (signInError) {
        setError("The email or password you entered is incorrect.");
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("We could not sign you in. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-700" htmlFor="email">
          Email address
        </label>
        <Input
          autoComplete="email"
          autoFocus
          className="h-12 rounded-xl border-stone-200 bg-white px-4 shadow-xs placeholder:text-stone-400 focus-visible:border-[#9c2c40] focus-visible:ring-[#9c2c40]/15"
          disabled={isPending}
          id="email"
          name="email"
          placeholder="you@caritas.org"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            className="text-sm font-semibold text-stone-700"
            htmlFor="password"
          >
            Password
          </label>
          <Link
            className="text-sm font-semibold text-[#8a2336] hover:text-[#671827] hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            autoComplete="current-password"
            className="h-12 rounded-xl border-stone-200 bg-white px-4 pr-12 shadow-xs placeholder:text-stone-400 focus-visible:border-[#9c2c40] focus-visible:ring-[#9c2c40]/15"
            disabled={isPending}
            id="password"
            minLength={8}
            name="password"
            placeholder="Enter your password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-stone-600">
        <input
          className="size-4 rounded accent-[#7d1d2d]"
          defaultChecked
          disabled={isPending}
          name="rememberMe"
          type="checkbox"
        />
        Keep me signed in
      </label>

      {error ? (
        <p
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        className="mt-1 h-12 w-full cursor-pointer rounded-xl bg-[#7d1d2d] text-sm font-semibold text-white shadow-[0_8px_22px_rgba(125,29,45,0.2)] hover:bg-[#681625]"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
