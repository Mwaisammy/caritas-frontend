"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import type { StaffUser } from "@/lib/go-api-client";
import { createStaffUser, goApiPost, GoApiError } from "@/lib/server/go-api";

const createStaffSchema = z.object({
  authUserId: z.string().trim().min(1, "Enter a Better Auth user ID.").max(128),
  branchId: z
    .string()
    .trim()
    .max(20)
    .regex(/^[1-9]\d*$/, "Branch ID must be a positive whole number."),
  role: z.enum([
    "system_admin",
    "manager",
    "loan_officer",
    "cashier",
    "auditor",
    "chairperson",
    "secretary",
  ]),
});

type StaffField = keyof z.infer<typeof createStaffSchema>;

export type CreateStaffState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<StaffField, string[]>>;
  staffUser?: StaffUser;
};

function messageForStatus(status: number) {
  switch (status) {
    case 400:
      return "The backend rejected these staff details.";
    case 401:
      return "Your session is no longer valid. Sign in again.";
    case 403:
      return "You do not have permission to create staff users.";
    case 409:
      return "A staff user with that email or identity already exists.";
    case 429:
      return "Too many requests. Wait a moment and try again.";
    case 504:
      return "The staff service took too long to respond. Try again.";
    default:
      return "The staff service is unavailable. Try again later.";
  }
}

// deactivateStaffAction uses the existing Go authorization and preserves the staff record.
export async function deactivateStaffAction(staffUserId: string) {
  if (!staffUserId) return { ok: false, message: "Choose a staff member." };
  try {
    await goApiPost("/api/v1/auth/deactivate-staff-user", { staffUserId });
    return { ok: true, message: "Staff access deactivated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof GoApiError && error.detail === "you cannot deactivate your own staff access"
          ? "You cannot deactivate your own staff access."
          : error instanceof GoApiError && error.status === 403
            ? "You do not have permission to manage staff access."
            : "Could not deactivate staff access.",
    };
  }
}

export async function createStaffAction(
  _previousState: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const parsed = createStaffSchema.safeParse({
    authUserId: formData.get("authUserId"),
    branchId: formData.get("branchId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [account] = await db
      .select({ name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, parsed.data.authUserId))
      .limit(1);
    if (!account) {
      return { status: "error", message: "Select an existing account." };
    }
    const result = await createStaffUser({
      ...parsed.data,
      name: account.name,
      email: account.email,
    });

    if (!result.staffUser) {
      return {
        status: "error",
        message: "The backend returned no staff record.",
      };
    }

    return { status: "success", staffUser: result.staffUser };
  } catch (error) {
    if (error instanceof GoApiError) {
      console.error("Create staff request failed", {
        requestId: error.requestId,
        status: error.status,
      });

      return { status: "error", message: messageForStatus(error.status) };
    }

    console.error("Unexpected create staff failure");
    return {
      status: "error",
      message: "The staff service is unavailable. Try again later.",
    };
  }
}
