"use client";

import {SubmitEvent, useState} from "react";

import {Eye, EyeOff, LoaderCircle} from "lucide-react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {authClient} from "@/lib/auth-client";

const SignUpForm = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type NewType = SubmitEvent<HTMLFormElement>;

  const handleSubmit = async (event: NewType) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsPending(true);

    try {
      const {error: signUpError} = await authClient.signUp.email({
        email,
        name,
        password,
      });

      if (signUpError) {
        setError(
          signUpError.status === 422
            ? "An account with these details could not be created."
            : "We could not create your account. Please try again.",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We could not create your account. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-700" htmlFor="name">
          Full name
        </label>
        <Input
          autoComplete="name"
          autoFocus
          className="h-12 rounded-xl border-stone-200 bg-white px-4 shadow-xs placeholder:text-stone-400 focus-visible:border-[#9c2c40] focus-visible:ring-[#9c2c40]/15"
          disabled={isPending}
          id="name"
          minLength={2}
          name="name"
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-700" htmlFor="email">
          Work email
        </label>
        <Input
          autoComplete="email"
          className="h-12 rounded-xl border-stone-200 bg-white px-4 shadow-xs placeholder:text-stone-400 focus-visible:border-[#9c2c40] focus-visible:ring-[#9c2c40]/15"
          disabled={isPending}
          id="email"
          name="email"
          placeholder="you@caritas.org"
          required
          type="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-stone-700"
            htmlFor="signup-password"
          >
            Password
          </label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="h-12 rounded-xl border-stone-200 bg-white px-4 pr-11 shadow-xs placeholder:text-stone-400 focus-visible:border-[#9c2c40] focus-visible:ring-[#9c2c40]/15"
              disabled={isPending}
              id="signup-password"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
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

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-stone-700"
            htmlFor="confirm-password"
          >
            Confirm password
          </label>
          <Input
            autoComplete="new-password"
            className="h-12 rounded-xl border-stone-200 bg-white px-4 shadow-xs placeholder:text-stone-400 focus-visible:border-[#9c2c40] focus-visible:ring-[#9c2c40]/15"
            disabled={isPending}
            id="confirm-password"
            minLength={8}
            name="confirmPassword"
            placeholder="Repeat password"
            required
            type={showPassword ? "text" : "password"}
          />
        </div>
      </div>

      <p className="text-xs leading-5 text-stone-500">
        Use at least 8 characters. Phone and staff verification will be added to
        this flow next.
      </p>

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
            Creating account…
          </span>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
