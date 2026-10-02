import {LoanApplicationForm} from "@/app/components/loans-ui/loan-application-form";

// NewLoanPage gives the longer application flow its own focused route.
export default function NewLoanPage() { return <div className="min-h-full bg-[#faf9f7] px-4 pb-14 sm:px-7 lg:px-9"><div className="mx-auto max-w-4xl space-y-6"><section className="rounded-2xl bg-linear-to-r from-[#961521] to-[#c8242f] px-6 py-7 text-white shadow-sm sm:px-8"><p className="text-sm font-medium text-red-100">Loan administration</p><h1 className="mt-2 text-3xl font-bold">New loan application</h1><p className="mt-2 text-sm text-red-50/85">Capture the terms, share pledge, and proposed guarantors for review.</p></section><LoanApplicationForm /></div></div>; }
