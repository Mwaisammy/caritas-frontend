import Link from "next/link";
import {notFound} from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ContactRound,
  FileClock,
  HeartHandshake,
  IdCard,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import {OpenAccountDialog} from "@/app/components/shares-ui/open-account-dialog";
import {GoApiError} from "@/lib/server/go-api";
import {getMember, getMemberStatusHistory} from "@/lib/server/members-api";
import {MEMBER_BRANCH_ID} from "../config";
import {EditMemberSidebar, MemberLifecycleForms} from "../member-forms";
import {
  buttonClass,
  formatDate,
  formatMoney,
  MemberStatusBadge,
  relationshipLabel,
} from "../member-ui";
import {getShareAccount} from "@/lib/server/shares-api";
import { getLoan, getLoanStatus } from "@/lib/server/loans-api";
import { getLoans } from "@/lib/api/loans";

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{className?: string}>;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <div className="mt-0.5 text-sm font-medium leading-5 text-stone-900 wrap-anywhere">
          {value === "" || value == null ? "—" : value}
        </div>
      </div>
    </div>
  );
}

function transitionLabel(value: string) {
  return value
    .replace("MEMBER_STATUS_", "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default async function MemberDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{memberId: string}>;
  searchParams: Promise<{historyToken?: string}>;
}) {
  const [{memberId}, query] = await Promise.all([params, searchParams]);
  const historyToken =
    typeof query.historyToken === "string" ? query.historyToken : "";
  const [memberResult, historyResult] = await Promise.allSettled([
    getMember({branchId: MEMBER_BRANCH_ID, memberId}),
    getMemberStatusHistory({
      memberId,
      pageSize: 20,
      ...(historyToken ? {pageToken: historyToken} : {}),
    }),
  ]);

  if (memberResult.status === "rejected") {
    if (
      memberResult.reason instanceof GoApiError &&
      memberResult.reason.status === 404
    )
      notFound();
    throw memberResult.reason;
  }
  const member = memberResult.value.member;

  if (!member) notFound();
  const history =
    historyResult.status === "fulfilled"
      ? historyResult.value
      : {transitions: [], nextPageToken: ""};
  const personal = member.profile?.personal;
  const employment = member.profile?.employment;
  const identification = member.profile?.idDocument;
  const nextOfKin = member.profile?.nextOfKin;

  const shareAccount = await getShareAccount({
    branchId: MEMBER_BRANCH_ID,
    nationalId: member?.nationalId,
  });

  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-7xl">
        <Link
          className={`${buttonClass("ghost")} mb-5`}
          href="/dashboard/members"
        >
          <ArrowLeft className="size-4" />
          Back to members
        </Link>
        <section className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="h-24 bg-linear-to-r from-[#a91521] to-[#ce2b35]" />
          <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-7">
            <div className="-mt-9 flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-red-50 text-2xl font-bold text-[#b71925] shadow-sm">
              {(personal?.fullName ?? "M")
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
                  {personal?.fullName ?? "Unnamed member"}
                </h1>
                <MemberStatusBadge status={member.status} />
              </div>
              <p className="mt-1 font-mono text-sm text-stone-500">
                Member no. {member.memberNumber}
              </p>
            </div>
            <EditMemberSidebar member={member} />
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-6">
            <div className="grid gap-5">
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-[#b71925]">
                    <UserRound className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-950">
                      Personal information
                    </h2>
                    <p className="text-xs text-stone-500">
                      Member identity and contact
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={Phone}
                    label="Phone"
                    value={personal?.phone}
                  />
                  <InfoItem icon={Mail} label="Email" value={personal?.email} />
                  <InfoItem
                    icon={CalendarDays}
                    label="Date of birth"
                    value={formatDate(personal?.dateOfBirth)}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Address"
                    value={personal?.address}
                  />
                  <InfoItem
                    icon={IdCard}
                    label="National ID"
                    value={member.nationalId}
                  />
                </div>
              </section>
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-[#b71925]">
                    <BriefcaseBusiness className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-950">Employment</h2>
                    <p className="text-xs text-stone-500">
                      Work and income declaration
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={BriefcaseBusiness}
                    label="Occupation"
                    value={employment?.occupation}
                  />
                  <InfoItem
                    icon={ContactRound}
                    label="Employer"
                    value={employment?.employer}
                  />
                  <InfoItem
                    icon={CalendarDays}
                    label="Monthly income"
                    value={
                      employment?.monthlyIncome
                        ? formatMoney(
                            employment.monthlyIncome.currencyCode,
                            employment.monthlyIncome.units,
                            employment.monthlyIncome.nanos,
                          )
                        : "—"
                    }
                  />
                </div>
              </section>
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-[#b71925]">
                    <IdCard className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-950">
                      Identification
                    </h2>
                    <p className="text-xs text-stone-500">
                      Supporting identity document
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={IdCard}
                    label="Document type"
                    value={
                      identification?.type === "national_id"
                        ? "National ID"
                        : identification?.type
                    }
                  />
                  <InfoItem
                    icon={IdCard}
                    label="Document number"
                    value={identification?.number}
                  />
                </div>
              </section>
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-[#b71925]">
                    <HeartHandshake className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-950">
                      Next of kin
                    </h2>
                    <p className="text-xs text-stone-500">Emergency contact</p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={UserRound}
                    label="Name"
                    value={nextOfKin?.name}
                  />
                  <InfoItem
                    icon={Phone}
                    label="Phone"
                    value={nextOfKin?.phone}
                  />
                  <InfoItem
                    icon={HeartHandshake}
                    label="Relationship"
                    value={relationshipLabel(nextOfKin?.relationship)}
                  />
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-2.5 text-[#b71925]">
                  <FileClock className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-950">
                    Status history
                  </h2>
                  <p className="text-xs text-stone-500">
                    Chronological audit trail
                  </p>
                </div>
              </div>
              {historyResult.status === "rejected" ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  The status history is temporarily unavailable.
                </div>
              ) : history.transitions.length ? (
                <div className="space-y-0">
                  {history.transitions.map((transition, index) => (
                    <div
                      className="grid grid-cols-[1.25rem_1fr] gap-3"
                      key={`${transition.occurredAt}-${index}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="mt-1 size-2.5 rounded-full bg-[#b71925] ring-4 ring-red-50" />
                        {index < history.transitions.length - 1 ? (
                          <span className="h-full w-px bg-stone-200" />
                        ) : null}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm font-semibold text-stone-900">
                          {transitionLabel(transition.fromStatus)}{" "}
                          <span className="px-1 text-stone-400">→</span>{" "}
                          {transitionLabel(transition.toStatus)}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {transition.reason}
                        </p>
                        <p className="mt-1 text-xs text-stone-400">
                          {formatDate(transition.occurredAt, true)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-stone-50 p-5 text-sm text-stone-500">
                  No status changes have been recorded yet.
                </p>
              )}
              {history.nextPageToken ? (
                <div className="mt-2 border-t border-stone-200 pt-4">
                  <Link
                    className={buttonClass("outline")}
                    href={`/dashboard/members/${encodeURIComponent(member.id)}?historyToken=${encodeURIComponent(history.nextPageToken)}`}
                  >
                    Older history
                  </Link>
                </div>
              ) : null}
            </section>
          </div>
          <aside className="space-y-5 xl:sticky xl:top-5">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-stone-950">
                Membership record
              </h2>
              <div className="my-4 h-px bg-stone-200" />
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-stone-500">Registered</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDate(member.registeredAt, true)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Last updated</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDate(member.lastUpdated, true)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Branch</p>
                  <p className="mt-1 text-sm font-medium">
                    {member.branchId ? `Branch ${member.branchId}` : "—"}
                  </p>
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-stone-950">Member services</h2>

              {shareAccount.account?.id ? null : (
                <>
                  <OpenAccountDialog member={member} />
                </>
              )}

              <Link
                className={buttonClass("outline")}
                href={`/dashboard/loans/new?memberId=${encodeURIComponent(member.id)}`}
              >
                Apply for loan
              </Link>
            </section>
            <MemberLifecycleForms member={member} />
          </aside>
        </div>
      </div>
    </div>
  );
}
