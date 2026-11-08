"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StaffRole, StaffUser } from "@/lib/go-api-client";
import {
  createStaffAction,
  deactivateStaffAction,
  type CreateStaffState,
} from "./staff-actions";

const roles: { value: StaffRole; label: string; detail: string }[] = [
  { value: "system_admin", label: "System admin", detail: "Full access" },
  { value: "manager", label: "Manager", detail: "Operations" },
  { value: "loan_officer", label: "Loan officer", detail: "Loans" },
  { value: "cashier", label: "Cashier", detail: "Cash and repayments" },
  { value: "auditor", label: "Auditor", detail: "Oversight" },
  { value: "chairperson", label: "Chairperson", detail: "Approvals" },
  { value: "secretary", label: "Secretary", detail: "Member records" },
];

// StaffPage mirrors the bounded Go response so the UI can request further pages.
type StaffPage = { staffUsers?: StaffUser[]; nextPageToken?: string };
// AuthAccount contains the identity details displayed during staff selection.
type AuthAccount = { id: string; name: string; email: string };

export default function StaffTestCard({ currentAuthUserId }: { currentAuthUserId: string }) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [branchIds, setBranchIds] = useState(["1"]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nextPageToken, setNextPageToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [open, setOpen] = useState(false);
  const [accountQuery, setAccountQuery] = useState("");
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [selected, setSelected] = useState<AuthAccount | null>(null);
  const [branchId, setBranchId] = useState("1");
  const [role, setRole] = useState<StaffRole>("cashier");
  const [deactivating, setDeactivating] = useState<StaffUser | null>(null);
  const [isDeactivating, startDeactivation] = useTransition();
  const [notice, setNotice] = useState("");
  const [state, setState] = useState<CreateStaffState>({ status: "idle" });
  const [isPending, setIsPending] = useState(false);

  // Refreshes staff after filters or an access change without loading all rows.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setLoadError("");
        const params = new URLSearchParams();
        if (query.trim()) params.set("query", query.trim());
        if (roleFilter) params.set("role", roleFilter);
        try {
          const response = await fetch(`/api/staff?${params}`, {
            signal: controller.signal,
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(
              data.message ?? "Staff records could not be loaded.",
            );
          setStaff((data as StaffPage).staffUsers ?? []);
          setBranchIds((current) => Array.from(new Set([...current, ...((data as StaffPage).staffUsers ?? []).map((person) => person.branchId)])));
          setNextPageToken((data as StaffPage).nextPageToken ?? "");
        } catch (error) {
          if (!controller.signal.aborted)
            setLoadError(
              error instanceof Error
                ? error.message
                : "Staff records could not be loaded.",
            );
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, roleFilter, refresh]);

  // Searches Better Auth after two characters while the grant dialog is open.
  useEffect(() => {
    if (!open || selected || accountQuery.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAccountLoading(true);
      setAccountError("");
      try {
        const response = await fetch(
          `/api/staff/eligible-users?query=${encodeURIComponent(accountQuery.trim())}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message ?? "Accounts could not be searched.");
        setAccounts(data.users ?? []);
      } catch (error) {
        if (!controller.signal.aborted)
          setAccountError(
            error instanceof Error
              ? error.message
              : "Accounts could not be searched.",
          );
      } finally {
        if (!controller.signal.aborted) setAccountLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [accountQuery, open, selected]);

  // submit grants access and refreshes the directory only after Go confirms creation.
  async function submit(formData: FormData) {
    setIsPending(true);
    try {
      const result = await createStaffAction(state, formData);
      setState(result);
      if (result.status !== "success" || !result.staffUser) return;
      setOpen(false);
      setSelected(null);
      setAccountQuery("");
      setNotice(`${result.staffUser.name} now has staff access.`);
      setRefresh((value) => value + 1);
    } finally {
      setIsPending(false);
    }
  }

  const branches = branchIds.toSorted((a, b) => Number(a) - Number(b));

  // loadMore appends one cursor page while preserving the current filters.
  async function loadMore() {
    if (!nextPageToken) return;
    try {
      const params = new URLSearchParams({ page_token: nextPageToken });
      if (query.trim()) params.set("query", query.trim());
      if (roleFilter) params.set("role", roleFilter);
      const response = await fetch(`/api/staff?${params}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message ?? "The next page could not be loaded.");
      setStaff((current) => [
        ...current,
        ...((data as StaffPage).staffUsers ?? []),
      ]);
      setBranchIds((current) => Array.from(new Set([...current, ...((data as StaffPage).staffUsers ?? []).map((person) => person.branchId)])));
      setNextPageToken((data as StaffPage).nextPageToken ?? "");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The next page could not be loaded.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck aria-hidden="true" /> Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Staff access
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Manage who can access Caritas and the role assigned to each person.
          </p>
        </div>
        {!loading && !loadError && (
          <Button onClick={() => setOpen(true)}>
            <UserPlus data-icon="inline-start" /> Add staff
          </Button>
        )}
      </div>
      {notice && (
        <Alert>
          <AlertTitle>Staff access</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
          <CardDescription>
            Search staff records and review their access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search staff"
                className="pl-9"
                placeholder="Search by name or email"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter by role"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:w-48"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="">All roles</option>
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {loadError ? (
            <Alert variant="destructive">
              <AlertTitle>Directory unavailable</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="flex flex-col gap-3" aria-label="Loading staff">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : staff.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No staff found</EmptyTitle>
                <EmptyDescription>
                  {query || roleFilter
                    ? "Try a different search or role."
                    : "Add the first staff member to get started."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Person</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">{person.name}{person.authUserId === currentAuthUserId && <Badge variant="outline">You</Badge>}</div>
                          <div className="text-sm text-muted-foreground">
                            {person.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {roles.find((item) => item.value === person.role)
                            ?.label ?? person.role}
                        </TableCell>
                        <TableCell>Branch {person.branchId}</TableCell>
                        <TableCell>
                          <Badge
                            variant={person.isActive ? "secondary" : "outline"}
                          >
                            {person.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {person.isActive && person.authUserId !== currentAuthUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeactivating(person)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-3 md:hidden">
                {staff.map((person) => (
                  <Card key={person.id} size="sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="flex items-center gap-2 truncate">
                            {person.name}{person.authUserId === currentAuthUserId && <Badge variant="outline">You</Badge>}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {person.email}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={person.isActive ? "secondary" : "outline"}
                        >
                          {person.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {roles.find((item) => item.value === person.role)
                          ?.label ?? person.role}{" "}
                        · Branch {person.branchId}
                      </span>
                      {person.isActive && person.authUserId !== currentAuthUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivating(person)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {nextPageToken && (
                <Button variant="outline" onClick={loadMore}>
                  Load more
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Grant staff access</DialogTitle>
            <DialogDescription>
              Select an existing account, then assign its branch and role.
            </DialogDescription>
          </DialogHeader>
          <form action={submit} className="flex flex-col gap-5">
            <FieldGroup>
              <Field data-invalid={Boolean(state.fieldErrors?.authUserId)}>
                <FieldLabel htmlFor="account-search">Account</FieldLabel>
                {selected ? (
                  <Card size="sm">
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{selected.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {selected.email}
                        </p>
                      </div>
                      <Button
                        aria-label="Choose another account"
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setSelected(null);
                          setAccountQuery("");
                        }}
                      >
                        <X />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Input
                      id="account-search"
                      autoComplete="off"
                      placeholder="Search name or email"
                      value={accountQuery}
                      onChange={(event) => {
                        setAccountQuery(event.target.value);
                        setAccounts([]);
                      }}
                    />
                    {accountLoading && (
                      <p className="text-sm text-muted-foreground">
                        Searching accounts…
                      </p>
                    )}
                    {accountError && <FieldError>{accountError}</FieldError>}
                    {!accountLoading &&
                      accountQuery.trim().length >= 2 &&
                      !accountError && (
                        <div className="max-h-48 overflow-y-auto rounded-md border p-1">
                          {accounts.length ? (
                            accounts.map((account) => (
                              <Button
                                key={account.id}
                                type="button"
                                variant="ghost"
                                className="h-auto w-full justify-start text-left"
                                onClick={() => setSelected(account)}
                              >
                                <span className="min-w-0">
                                  <span className="block font-medium">
                                    {account.name}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {account.email}
                                  </span>
                                </span>
                              </Button>
                            ))
                          ) : (
                            <p className="p-3 text-sm text-muted-foreground">
                              No matching accounts.
                            </p>
                          )}
                        </div>
                      )}
                  </>
                )}
                <input
                  type="hidden"
                  name="authUserId"
                  value={selected?.id ?? ""}
                />
                {state.fieldErrors?.authUserId && (
                  <FieldError>{state.fieldErrors.authUserId[0]}</FieldError>
                )}
                <FieldDescription>
                  The person must already have a Better Auth account.
                </FieldDescription>
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.branchId)}>
                <FieldLabel htmlFor="branch">Branch</FieldLabel>
                <select
                  id="branch"
                  name="branchId"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                >
                  {branches.map((id) => (
                    <option key={id} value={id}>
                      Branch {id}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.branchId && (
                  <FieldError>{state.fieldErrors.branchId[0]}</FieldError>
                )}
                <FieldDescription>
                  Branches are shown by ID until branch names are available.
                </FieldDescription>
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.role)}>
                <FieldLabel htmlFor="staff-role">Role</FieldLabel>
                <select
                  id="staff-role"
                  name="role"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={role}
                  onChange={(event) => setRole(event.target.value as StaffRole)}
                >
                  {roles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} — {item.detail}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.role && (
                  <FieldError>{state.fieldErrors.role[0]}</FieldError>
                )}
              </Field>
            </FieldGroup>
            {selected && (
              <Alert>
                <AlertTitle>Review access</AlertTitle>
                <AlertDescription>
                  {selected.name} ({selected.email}) will receive the{" "}
                  {roles.find((item) => item.value === role)?.label} role in
                  Branch {branchId}.
                </AlertDescription>
              </Alert>
            )}
            {state.status === "error" && (
              <Alert variant="destructive">
                <AlertTitle>Could not grant access</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selected || isPending}>
                {isPending && <Spinner data-icon="inline-start" />}Grant access
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deactivating)}
        onOpenChange={(value) => {
          if (!value) setDeactivating(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate staff access?</DialogTitle>
            <DialogDescription>
              {deactivating?.name} will no longer be able to use their Caritas
              staff role. Their staff record will be kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivating(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeactivating}
              onClick={() => {
                if (!deactivating) return;
                startDeactivation(async () => {
                  const result = await deactivateStaffAction(deactivating.id);
                  setNotice(result.message);
                  if (result.ok) {
                    setDeactivating(null);
                    setRefresh((value) => value + 1);
                  }
                });
              }}
            >
              {isDeactivating && <Spinner data-icon="inline-start" />}Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
