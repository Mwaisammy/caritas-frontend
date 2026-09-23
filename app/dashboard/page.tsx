import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import StaffTestCard from "./staff-test-card";

const Home = async () => {
  const session = await auth.api.getSession({headers: await headers()});

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9c2c40]">
          Administration
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Staff access console
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          Link an existing Better Auth identity to a Caritas staff role. The Go
          backend makes the final authorization decision.
        </p>
      </div>

      <StaffTestCard currentUser={session?.user ?? null} />
    </div>
  );
};

export default Home;
