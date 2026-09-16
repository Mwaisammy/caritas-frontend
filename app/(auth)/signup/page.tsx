import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignUpForm from "./signup-form";

const SignUp = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full">
      <div>
        <p className="text-sm font-semibold text-[#9c2c40]">Staff registration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-stone-950 sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-stone-500 sm:text-base">
          Register with your official staff details. Access is limited to
          authorised Caritas personnel.
        </p>
      </div>
      <SignUpForm />
    </div>
  );
};

export default SignUp;
