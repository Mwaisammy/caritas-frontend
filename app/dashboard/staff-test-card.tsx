"use client";

import {SubmitEvent, useState} from "react";
import {useMutation} from "@tanstack/react-query";
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
import type {StaffRole, StaffUser} from "@/lib/go-api-client";
import {useTRPC} from "@/trpc/client";

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
  const trpc = useTRPC();
  const createStaff = useMutation(trpc.staff.create.mutationOptions());
  const [role, setRole] = useState<StaffRole>("cashier");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<StaffUser | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreated(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const authUserId = String(data.get("authUserId") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const branchId = String(data.get("branchId") ?? "").trim();

    if (!/^\d+$/.test(branchId) || branchId === "0") {
      setError("Branch ID must be a positive whole number.");
      return;
    }

    try {
      const result = await createStaff.mutateAsync({
        authUserId,
        branchId,
        email,
        name,
        role,
      });

      if (!result.staffUser) {
        setError("The backend returned no staff record.");
        return;
      }

      setCreated(result.staffUser);
      form.reset();
      setRole("cashier");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The staff request failed.",
      );
    }
  }

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

        <form onSubmit={handleSubmit}>
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
                  disabled={createStaff.isPending}
                  id="authUserId"
                  name="authUserId"
                  placeholder="Paste user.id from Better Auth"
                  required
                />
              </div>
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
                disabled={createStaff.isPending}
                id="name"
                minLength={2}
                name="name"
                placeholder="Jane Wanjiku"
                required
              />
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
                disabled={createStaff.isPending}
                id="email"
                name="email"
                placeholder="jane@caritas.org"
                required
                type="email"
              />
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
                disabled={createStaff.isPending}
                id="branchId"
                inputMode="numeric"
                min="1"
                name="branchId"
                required
                type="number"
              />
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
                disabled={createStaff.isPending}
                id="role"
                onChange={(event) => setRole(event.target.value as StaffRole)}
                value={role}
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.detail}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:col-span-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p aria-live="polite">{error}</p>
              </div>
            ) : null}

            {created ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-medium text-emerald-950">
                      Staff access created
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      {created.name} can now authenticate as{" "}
                      {created.role.replaceAll("_", " ")}.
                    </p>
                    <p className="mt-2 truncate font-mono text-xs text-emerald-700">
                      Staff ID: {created.id}
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
              disabled={createStaff.isPending}
              type="submit"
            >
              {createStaff.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <UserPlus />
              )}
              {createStaff.isPending ? "Creating…" : "Create staff access"}
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
