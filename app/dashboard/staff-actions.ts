"use server";

import {z} from "zod";

import type {StaffUser} from "@/lib/go-api-client";
import {createStaffUser, GoApiError} from "@/lib/server/go-api";

const createStaffSchema = z.object({
  authUserId: z.string().trim().min(1, "Enter a Better Auth user ID.").max(128),
  branchId: z
    .string()
    .trim()
    .max(20)
    .regex(/^[1-9]\d*$/, "Branch ID must be a positive whole number."),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120),
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

export async function createStaffAction(
  _previousState: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const parsed = createStaffSchema.safeParse({
    authUserId: formData.get("authUserId"),
    branchId: formData.get("branchId"),
    email: formData.get("email"),
    name: formData.get("name"),
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
    const result = await createStaffUser(parsed.data);

    if (!result.staffUser) {
      return {
        status: "error",
        message: "The backend returned no staff record.",
      };
    }

    return {status: "success", staffUser: result.staffUser};
  } catch (error) {
    if (error instanceof GoApiError) {
      console.error("Create staff request failed", {
        requestId: error.requestId,
        status: error.status,
      });

      return {status: "error", message: messageForStatus(error.status)};
    }

    console.error("Unexpected create staff failure");
    return {
      status: "error",
      message: "The staff service is unavailable. Try again later.",
    };
  }
}
