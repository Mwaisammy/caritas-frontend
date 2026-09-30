import Link from "next/link";
import {ArrowLeft, UserPlus} from "lucide-react";

import {MemberProfileForm} from "../member-forms";
import {buttonClass} from "../member-ui";

export default function NewMemberPage() {
  return (
    <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-4xl">
        <Link className={`${buttonClass("ghost")} mb-5`} href="/dashboard/members"><ArrowLeft className="size-4" />Back to members</Link>
        <div className="mb-6 flex items-start gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#b71925] text-white shadow-lg shadow-red-900/15"><UserPlus /></div><div><h1 className="text-3xl font-bold tracking-tight text-stone-950">Register a member</h1><p className="mt-1 text-sm text-stone-600">Create a Branch 01 membership profile. New registrations will use the backend’s initial status.</p></div></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><MemberProfileForm /></div>
      </div>
    </div>
  );
}
