"use client";

import {useActionState, useEffect, useRef} from "react";
import {
  BadgeCheck,
  CircleAlert,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import type {StaffRole} from "@/lib/go-api-client";
import {
  createStaffAction,
  type CreateStaffState,
} from "./staff-actions";

const roles: Array<{value: StaffRole; label: string; detail: string}> = [
  {value: "system_admin", label: "System admin", detail: "Full system access"},
  {value: "manager", label: "Manager", detail: "Operational oversight"},
  {value: "loan_officer", label: "Loan officer", detail: "Loan applications"},
  {value: "cashier", label: "Cashier", detail: "Cash and repayments"},
  {value: "auditor", label: "Auditor", detail: "Read-only oversight"},
  {value: "chairperson", label: "Chairperson", detail: "Approvals"},
  {value: "secretary", label: "Secretary", detail: "Member records"},
];

export default function StaffTestCard({
  currentUser,
}: {
  currentUser: {name: string; email: string} | null;
}) {
  const initialState: CreateStaffState = {status: "idle"};
  const [state, formAction, isPending] = useActionState(
    createStaffAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <Card className="border-0 shadow-[0_20px_70px_rgba(61,36,40,0.1)] ring-stone-200">
        <CardHeader className="border-b bg-gradient-to-r from-[#7d1d2d] to-[#a13b4d] py-6 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="size-5" />
            Create staff user
          </CardTitle>
          <CardDescription className="max-w-xl text-white/75">
            The identity must already exist in Better Auth. This operation only
            assigns its Caritas branch and role.
          </CardDescription>
          <CardAction>
            <div className="rounded-full bg-white/10 p-2 ring-1 ring-white/20">
              <ShieldCheck className="size-5" />
            </div>
          </CardAction>
        </CardHeader>

        <form action={formAction} ref={formRef}>
          <CardContent className="grid gap-5 py-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label
                className="text-sm font-medium text-stone-800"
                htmlFor="authUserId"
              >
                Better Auth user ID
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  className="h-11 bg-stone-50 pl-10 font-mono text-xs"
                  aria-describedby="authUserId-error"
                  aria-invalid={Boolean(state.fieldErrors?.authUserId)}
                  disabled={isPending}
                  id="authUserId"
                  name="authUserId"
                  placeholder="Paste user.id from Better Auth"
                  required
                />
              </div>
              {state.fieldErrors?.authUserId ? (
                <p className="text-xs text-red-700" id="authUserId-error">
                  {state.fieldErrors.authUserId[0]}
                </p>
              ) : null}
              <p className="text-xs text-stone-500">
                Use the new staff member&apos;s ID—not your administrator ID.
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-stone-800"
                htmlFor="name"
              >
                Full name
              </label>
              <Input
                className="h-11 bg-stone-50"
                aria-describedby="name-error"
                aria-invalid={Boolean(state.fieldErrors?.name)}
                disabled={isPending}
                id="name"
                minLength={2}
                name="name"
                placeholder="Jane Wanjiku"
                required
              />
              {state.fieldErrors?.name ? (
                <p className="text-xs text-red-700" id="name-error">
                  {state.fieldErrors.name[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-stone-800"
                htmlFor="email"
              >
                Work email
              </label>
              <Input
                className="h-11 bg-stone-50"
                aria-describedby="email-error"
                aria-invalid={Boolean(state.fieldErrors?.email)}
                disabled={isPending}
                id="email"
                name="email"
                placeholder="jane@caritas.org"
                required
                type="email"
              />
              {state.fieldErrors?.email ? (
                <p className="text-xs text-red-700" id="email-error">
                  {state.fieldErrors.email[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-stone-800"
                htmlFor="branchId"
              >
                Branch ID
              </label>
              <Input
                className="h-11 bg-stone-50"
                defaultValue="1"
                aria-describedby="branchId-error"
                aria-invalid={Boolean(state.fieldErrors?.branchId)}
                disabled={isPending}
                id="branchId"
                inputMode="numeric"
                min="1"
                name="branchId"
                required
                type="number"
              />
              {state.fieldErrors?.branchId ? (
                <p className="text-xs text-red-700" id="branchId-error">
                  {state.fieldErrors.branchId[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-stone-800"
                htmlFor="role"
              >
                Staff role
              </label>
              <select
                className="h-11 w-full rounded-lg border border-input bg-stone-50 px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                aria-describedby="role-error"
                aria-invalid={Boolean(state.fieldErrors?.role)}
                defaultValue="cashier"
                disabled={isPending}
                id="role"
                name="role"
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.detail}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.role ? (
                <p className="text-xs text-red-700" id="role-error">
                  {state.fieldErrors.role[0]}
                </p>
              ) : null}
            </div>

            {state.status === "error" ? (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:col-span-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p aria-live="polite" role="alert">
                  {state.message}
                </p>
              </div>
            ) : null}

            {state.status === "success" && state.staffUser ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-medium text-emerald-950">
                      Staff access created
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      {state.staffUser.name} can now authenticate as{" "}
                      {state.staffUser.role.replaceAll("_", " ")}.
                    </p>
                    <p className="mt-2 truncate font-mono text-xs text-emerald-700">
                      Staff ID: {state.staffUser.id}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="justify-between gap-4 bg-stone-50">
            <p className="hidden text-xs text-stone-500 sm:block">
              Duplicate email or auth ID returns a conflict.
            </p>
            <Button
              className="h-10 w-full bg-[#7d1d2d] px-5 hover:bg-[#681625] sm:w-auto"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <UserPlus />
              )}
              {isPending ? "Creating…" : "Create staff access"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-stone-950 text-stone-50 ring-stone-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            Test flow
          </CardTitle>
          <CardDescription className="text-stone-400">
            Signed in as {currentUser?.email ?? "an unknown account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">1. Identity exists</p>
            <p className="mt-1 text-xs leading-5 text-stone-400">
              Create the person in Better Auth and copy their user ID.
            </p>
          </div>
          <Separator className="bg-stone-800" />
          <div>
            <p className="font-medium">2. Admin authorizes</p>
            <p className="mt-1 text-xs leading-5 text-stone-400">
              Your JWT is forwarded to Go, which requires system_admin.
            </p>
          </div>
          <Separator className="bg-stone-800" />
          <div>
            <p className="font-medium">3. Staff signs in</p>
            <p className="mt-1 text-xs leading-5 text-stone-400">
              Their JWT subject resolves to the newly created staff record.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
