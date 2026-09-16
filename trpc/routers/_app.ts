import { z } from "zod";

import { goApi } from "../go-api";
import { authenticatedProcedure, createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  staff: createTRPCRouter({
    create: authenticatedProcedure
      .input(
        z.object({
          authUserId: z.string().trim().min(1),
          branchId: z.string().regex(/^[1-9]\d*$/),
          email: z
            .email()
            .transform((value) => value.trim().toLowerCase()),
          name: z.string().trim().min(2),
          role: z.enum([
            "system_admin",
            "manager",
            "loan_officer",
            "cashier",
            "auditor",
            "chairperson",
            "secretary",
          ]),
        }),
      )
      .mutation(({ ctx, input }) => {
        return goApi.createStaffUser(
          ctx.authorization,
          ctx.requestId as string,
          input,
        );
      }),
  }),

  members: authenticatedProcedure
    .input(
      z.object({
        branchId: z.string().min(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        pageToken: z.string().default(""),
        statusFilter: z
          .enum([
            "MEMBER_STATUS_UNSPECIFIED",
            "MEMBER_STATUS_PENDING",
            "MEMBER_STATUS_ACTIVE",
            "MEMBER_STATUS_SUSPENDED",
            "MEMBER_STATUS_CLOSED",
            "MEMBER_STATUS_REJECTED",
          ])
          .optional(),
      }),
    )
    .query(({ ctx, input }) =>
      goApi.listMembers(
        ctx.authorization,
        ctx.requestId as string,
        input,
      ),
    ),
});

// Export the API router type.
export type AppRouter = typeof appRouter;