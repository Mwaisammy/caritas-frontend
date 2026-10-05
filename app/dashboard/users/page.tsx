"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CircleAlert, LoaderCircle, Pencil, Search, UsersRound, X } from "lucide-react";
import type { Member, MemberProfile, MemberStatus } from "@/lib/go-api-client";
import { useTRPC } from "@/trpc/client";

const statuses: { value: MemberStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "MEMBER_STATUS_PENDING", label: "Pending" },
  { value: "MEMBER_STATUS_ACTIVE", label: "Active" },
  { value: "MEMBER_STATUS_SUSPENDED", label: "Suspended" },
  { value: "MEMBER_STATUS_CLOSED", label: "Closed" },
  { value: "MEMBER_STATUS_REJECTED", label: "Rejected" },
];

const statusLabel = (status: MemberStatus) =>
  status.replace("MEMBER_STATUS_", "").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());

const statusTone: Record<MemberStatus, string> = {
  MEMBER_STATUS_UNSPECIFIED: "bg-slate-100 text-slate-700",
  MEMBER_STATUS_PENDING: "bg-amber-50 text-amber-700",
  MEMBER_STATUS_ACTIVE: "bg-emerald-50 text-emerald-700",
  MEMBER_STATUS_SUSPENDED: "bg-orange-50 text-orange-700",
  MEMBER_STATUS_CLOSED: "bg-slate-100 text-slate-600",
  MEMBER_STATUS_REJECTED: "bg-red-50 text-red-700",
};

const emptyProfile = (): MemberProfile => ({
  personal: { fullName: "", phone: "", email: "", dateOfBirth: "", address: "" },
  employment: { occupation: "", employer: "" },
  idDocument: { type: "", number: "" },
  nextOfKin: { name: "", phone: "", relationship: "RELATIONSHIP_TYPE_UNSPECIFIED" },
});

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return <label className="block space-y-1.5 text-xs font-medium text-slate-600">
    <span>{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required}
      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 outline-none focus:border-[#b72736] focus:ring-2 focus:ring-red-100" />
  </label>;
}

function MemberEditor({ member, onClose }: { member: Member; onClose: () => void }) {
  const [profile, setProfile] = useState<MemberProfile>(() => ({ ...emptyProfile(), ...member.profile }));

  const personal = profile.personal ?? emptyProfile().personal!;
  const employment = profile.employment ?? emptyProfile().employment!;
  const idDocument = profile.idDocument ?? emptyProfile().idDocument!;
  const nextOfKin = profile.nextOfKin ?? emptyProfile().nextOfKin!;

  const setPersonal = (key: keyof NonNullable<MemberProfile["personal"]>, value: string) =>
    setProfile((current) => ({ ...current, personal: { ...personal, [key]: value } }));
  const setEmployment = (key: "occupation" | "employer", value: string) =>
    setProfile((current) => ({ ...current, employment: { ...employment, [key]: value } }));
  const setIdDocument = (key: "type" | "number", value: string) =>
    setProfile((current) => ({ ...current, idDocument: { ...idDocument, [key]: value } }));
  const setNextOfKin = (key: "name" | "phone", value: string) =>
    setProfile((current) => ({ ...current, nextOfKin: { ...nextOfKin, [key]: value } }));

  return <aside aria-labelledby="member-details-heading" className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
    <div className="flex items-start justify-between border-b border-gray-100 p-5">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-[#b72736]">Member details</p><h2 id="member-details-heading" className="mt-1 text-xl font-semibold">{member.profile?.personal?.fullName || member.memberNumber}</h2><p className="mt-1 text-xs text-slate-500">{member.memberNumber} · {member.id}</p></div>
      <button type="button" onClick={onClose} aria-label="Close member details" className="rounded-lg p-2 text-slate-500 hover:bg-gray-100"><X className="size-4" /></button>
    </div>
    <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-4 text-xs">
      <span className={`rounded-full px-2.5 py-1 font-medium ${statusTone[member.status]}`}>{statusLabel(member.status)}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Branch {member.branchId}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">National ID {member.nationalId}</span>
    </div>
    <div className="space-y-6 p-5">
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Edit preview: changes here are local to this page. Saving will be enabled when the member update endpoint is connected.</p>
      <div><h3 className="mb-3 text-sm font-semibold">Personal information</h3><div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" value={personal.fullName} onChange={(value) => setPersonal("fullName", value)} required />
        <Field label="Phone number" value={personal.phone} onChange={(value) => setPersonal("phone", value)} required />
        <Field label="Email" type="email" value={personal.email} onChange={(value) => setPersonal("email", value)} required />
        <Field label="Date of birth" type="date" value={personal.dateOfBirth?.slice(0, 10) ?? ""} onChange={(value) => setPersonal("dateOfBirth", value)} required />
        <div className="sm:col-span-2"><Field label="Address" value={personal.address} onChange={(value) => setPersonal("address", value)} required /></div>
      </div></div>
      <div><h3 className="mb-3 text-sm font-semibold">Employment</h3><div className="grid gap-3 sm:grid-cols-2">
        <Field label="Occupation" value={employment.occupation} onChange={(value) => setEmployment("occupation", value)} />
        <Field label="Employer" value={employment.employer} onChange={(value) => setEmployment("employer", value)} />
        <Field label="Monthly income" type="number" value={employment.monthlyIncome?.units ?? ""} onChange={(value) => setProfile((current) => ({ ...current, employment: { ...employment, monthlyIncome: { currencyCode: employment.monthlyIncome?.currencyCode || "KES", units: value, nanos: 0 } } }))} />
        <p className="self-end pb-3 text-xs text-slate-500">Currency: {employment.monthlyIncome?.currencyCode || "KES"}</p>
      </div></div>
      <div><h3 className="mb-3 text-sm font-semibold">Identification</h3><div className="grid gap-3 sm:grid-cols-2">
        <Field label="Document type" value={idDocument.type} onChange={(value) => setIdDocument("type", value)} />
        <Field label="Document number" value={idDocument.number} onChange={(value) => setIdDocument("number", value)} />
      </div></div>
      <div><h3 className="mb-3 text-sm font-semibold">Next of kin</h3><div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" value={nextOfKin.name} onChange={(value) => setNextOfKin("name", value)} />
        <Field label="Phone" value={nextOfKin.phone} onChange={(value) => setNextOfKin("phone", value)} />
        <label className="block space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2"><span>Relationship</span><select value={nextOfKin.relationship} onChange={(event) => setProfile((current) => ({ ...current, nextOfKin: { ...nextOfKin, relationship: event.target.value as NonNullable<MemberProfile["nextOfKin"]>["relationship"] } }))} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#b72736]">
          <option value="RELATIONSHIP_TYPE_UNSPECIFIED">Not specified</option><option value="RELATIONSHIP_TYPE_SPOUSE">Spouse</option><option value="RELATIONSHIP_TYPE_CHILD">Child</option><option value="RELATIONSHIP_TYPE_PARENT">Parent</option><option value="RELATIONSHIP_TYPE_SIBLING">Sibling</option><option value="RELATIONSHIP_TYPE_FRIEND">Friend</option><option value="RELATIONSHIP_TYPE_OTHER">Other</option>
        </select></label>
      </div></div>
      <div className="border-t border-gray-100 pt-4"><p className="text-xs text-slate-500">Registered: {member.registeredAt || "—"} · Last updated: {member.lastUpdated || "—"}</p><p className="mt-1 text-xs text-slate-500">Member number, branch, national ID and status are managed separately from profile details.</p>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setProfile({ ...emptyProfile(), ...member.profile })} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-slate-700 hover:bg-gray-50">Discard edits</button><button type="button" disabled aria-describedby="saving-unavailable" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#b72736] px-4 text-sm font-semibold text-white opacity-50"><Pencil className="size-4" />Save changes</button></div>
        <p id="saving-unavailable" className="mt-2 text-xs text-slate-500">Saving is unavailable until the backend update endpoint is connected.</p>
      </div>
    </div>
  </aside>;
}

export default function UsersPage() {
  const trpc = useTRPC();
  const [branchId, setBranchId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MemberStatus | "ALL">("ALL");
  const [pageToken, setPageToken] = useState("");
  const [previousTokens, setPreviousTokens] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const validBranch = /^[1-9]\d*$/.test(branchId);
  const query = useQuery({
    ...trpc.members.queryOptions({ branchId, pageSize: 20, pageToken, ...(status === "ALL" ? {} : { statusFilter: status }) }),
    enabled: validBranch,
  });
  const members = query.data?.members ?? [];
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((member) => !term || [member.profile?.personal?.fullName, member.memberNumber, member.nationalId, member.profile?.personal?.email].some((value) => value?.toLowerCase().includes(term)));
  }, [members, search]);
  const selected = members.find((member) => member.id === selectedId);

  function resetList() { setPageToken(""); setPreviousTokens([]); setSelectedId(null); }
  function nextPage() { if (query.data?.nextPageToken) { setPreviousTokens((current) => [...current, pageToken]); setPageToken(query.data.nextPageToken); setSelectedId(null); } }
  function previousPage() { const tokens = [...previousTokens]; setPageToken(tokens.pop() ?? ""); setPreviousTokens(tokens); setSelectedId(null); }

  return <div className="min-h-screen space-y-5 px-5 pb-12 text-gray-900 sm:px-7">
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b72736]">Member management</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Users</h1><p className="mt-2 text-sm text-slate-500">Review member records and update their profile details.</p></div><span className="rounded-xl bg-red-50 p-3 text-[#b72736]"><UsersRound className="size-7" /></span></div>
      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5"><label className="space-y-1.5 text-xs font-medium text-slate-600"><span>Branch ID</span><input inputMode="numeric" pattern="[1-9][0-9]*" value={branchId} onChange={(event) => { setBranchId(event.target.value.trim()); resetList(); }} placeholder="Enter branch ID" className="block h-10 w-40 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#b72736]" /></label><p className="pb-2 text-xs text-slate-500">Members are loaded for the selected branch.</p></div>
    </section>
    <div className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]" : ""}`}>
      <section aria-labelledby="member-table-heading" className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 id="member-table-heading" className="text-lg font-semibold">Member directory</h2><p className="mt-1 text-xs text-slate-500">Select a row to see and edit the member profile.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search current page</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search current page" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#b72736] sm:w-52" /></label><label><span className="sr-only">Filter member status</span><select value={status} onChange={(event) => { setStatus(event.target.value as MemberStatus | "ALL"); resetList(); }} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#b72736]">{statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div></div>
        {!validBranch ? <div className="flex flex-col items-center py-16 text-center"><UsersRound className="mb-3 size-9 text-[#b72736]" /><p className="font-semibold">Choose a branch to view members</p><p className="mt-1 text-sm text-slate-500">Enter a positive branch ID above.</p></div> : query.isPending ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" />Loading members…</div> : query.isError ? <div role="alert" className="mt-5 flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><CircleAlert className="size-5 shrink-0" /><span>{query.error.message}</span></div> : <>
          <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-gray-50 text-xs text-slate-500"><tr><th scope="col" className="px-4 py-3 font-medium">Member</th><th scope="col" className="px-4 py-3 font-medium">Member number</th><th scope="col" className="px-4 py-3 font-medium">Phone</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Registered</th></tr></thead><tbody>{visible.map((member) => <tr key={member.id} className={`cursor-pointer border-t border-gray-100 hover:bg-red-50/50 ${selectedId === member.id ? "bg-red-50" : ""}`} onClick={() => setSelectedId(member.id)}><td className="px-4 py-3"><button type="button" className="text-left font-medium text-gray-900 underline-offset-2 focus-visible:underline" onClick={() => setSelectedId(member.id)}>{member.profile?.personal?.fullName || "Unnamed member"}</button><span className="block text-xs text-slate-500">{member.profile?.personal?.email || "No email"}</span></td><td className="px-4 py-3 text-slate-600">{member.memberNumber}</td><td className="px-4 py-3 text-slate-600">{member.profile?.personal?.phone || "—"}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[member.status]}`}>{statusLabel(member.status)}</span></td><td className="px-4 py-3 text-slate-500">{member.registeredAt ? new Date(member.registeredAt).toLocaleDateString("en-KE") : "—"}</td></tr>)}{visible.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">{members.length === 0 ? "No members found in this branch." : "No members match your search."}</td></tr>}</tbody></table></div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500"><span>Showing {visible.length} members on this page</span><div className="flex gap-2"><button type="button" onClick={previousPage} disabled={previousTokens.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"><ArrowLeft className="size-3.5" />Previous</button><button type="button" onClick={nextPage} disabled={!query.data?.nextPageToken} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40">Next<ArrowRight className="size-3.5" /></button></div></div>
        </>}
      </section>
      {selected && <MemberEditor key={selected.id} member={selected} onClose={() => setSelectedId(null)} />}
    </div>
  </div>;
}
