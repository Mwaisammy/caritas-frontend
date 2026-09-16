import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/auth';
import { randomUUID } from 'crypto'
 
/**
 * This context creator accepts `headers` so it can be reused in both
 * the RSC server caller (where you pass `next/headers`) and the
 * API route handler (where you pass the request headers).
 */
export async function createTRPCContext({headers}: {headers: Headers}) {
  const session = await auth.api.getSession({headers});
  const requestId = headers.get("x-request-id") ?? randomUUID();

  if (!session) {
    return {
      authorization: null,
      requestId,
    };
  }

  const result = await auth.api.getToken({headers});

  if (result.token == "") {
    console.error("result token shouldnt be empty");
    // TODO-look whether a throw new Error is better right here

  } 

  return {
    authorization: `Bearer ${result.token}`,
    requestId,
  };
}



const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
export const authenticatedProcedure = t.procedure.use(({ctx, next}) => {
  if (!ctx.authorization?.startsWith("Bearer ")) {
    throw new TRPCError({code: "UNAUTHORIZED", message: "Authentication required"});
  }
  return next({
    ctx: {
      ...ctx,
      authorization: ctx.authorization,
    },
  });
});
