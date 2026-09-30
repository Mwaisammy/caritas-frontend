import Link from "next/link";
import {SearchX} from "lucide-react";
import {buttonClass} from "../member-ui";

export default function MemberNotFound() {
  return <div className="min-h-full bg-[#faf9f7] px-4 pb-14"><div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm"><SearchX className="mx-auto size-10 text-stone-400" /><h1 className="mt-4 text-2xl font-bold">Member not found</h1><p className="mt-2 text-sm text-stone-500">The record may not exist in Branch 01 or may no longer be available.</p><Link className={`${buttonClass()} mt-6`} href="/dashboard/members">Return to members</Link></div></div>;
}
