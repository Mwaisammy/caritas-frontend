"use server";

import {revalidatePath, updateTag} from "next/cache";
import {z} from "zod";

import type {
  MemberProfile,
  MemberStatus,
  RelationshipType,
} from "@/lib/go-api-client";
import {GoApiError} from "@/lib/server/go-api";
import {
  closeMember,
  registerMember,
  updateMemberProfile,
  updateMemberStatus,
} from "@/lib/server/members-api";
import {MEMBER_BRANCH_ID} from "./config";

const relationshipValues = [
  "RELATIONSHIP_TYPE_SPOUSE",
  "RELATIONSHIP_TYPE_CHILD",
  "RELATIONSHIP_TYPE_PARENT",
  "RELATIONSHIP_TYPE_SIBLING",
  "RELATIONSHIP_TYPE_FRIEND",
  "RELATIONSHIP_TYPE_OTHER",
] as const satisfies readonly RelationshipType[];

const editableStatusValues = [
  "MEMBER_STATUS_PENDING",
  "MEMBER_STATUS_ACTIVE",
  "MEMBER_STATUS_SUSPENDED",
  "MEMBER_STATUS_REJECTED",
] as const satisfies readonly MemberStatus[];

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the member's full name.").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
  dateOfBirth: z.string().date("Enter a valid date of birth."),
  address: z.string().trim().min(2, "Enter the member's address.").max(240),
  occupation: z.string().trim().min(2, "Enter an occupation.").max(100),
  employer: z.string().trim().min(2, "Enter an employer or 'Self-employed'.").max(120),
  monthlyIncome: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter an amount with up to 10 whole digits and 2 decimal places."),
  currencyCode: z.literal("KES"),
  idType: z.string().trim().min(2, "Enter an identification type.").max(50),
  idNumber: z.string().trim().min(2, "Enter the identification number.").max(80),
  nextOfKinName: z.string().trim().min(2, "Enter the next of kin's name.").max(120),
  nextOfKinPhone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  relationship: z.enum(relationshipValues),
});

const registerSchema = profileSchema.extend({
  nationalId: z.string().trim().min(4, "Enter a valid national ID.").max(80),
});

const updateProfileSchema = profileSchema.extend({
  memberId: z.string().trim().min(1, "The member ID is required."),
});

type ActionError = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ActionData = {
  message: string;
  memberId?: string;
};

export type MemberActionResult =
  | {ok: true; data: ActionData}
  | {ok: false; error: ActionError};

export type MemberActionState = MemberActionResult | null;

function profileFrom(data: z.infer<typeof profileSchema>): MemberProfile {
  return {
    personal: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00.000Z`).toISOString(),
      address: data.address,
    },
    employment: {
      occupation: data.occupation,
      employer: data.employer,
      monthlyIncome: {
        currencyCode: data.currencyCode,
        units: data.monthlyIncome.split(".")[0],
        nanos: Number((data.monthlyIncome.split(".")[1] ?? "").padEnd(9, "0")),
      },
    },
    idDocument: {type: data.idType, number: data.idNumber},
    nextOfKin: {
      name: data.nextOfKinName,
      phone: data.nextOfKinPhone,
      relationship: data.relationship,
    },
  };
}

function profileInput(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    dateOfBirth: formData.get("dateOfBirth"),
    address: formData.get("address"),
    occupation: formData.get("occupation"),
    employer: formData.get("employer"),
    monthlyIncome: formData.get("monthlyIncome"),
    currencyCode: formData.get("currencyCode"),
    idType: formData.get("idType"),
    idNumber: formData.get("idNumber"),
    nextOfKinName: formData.get("nextOfKinName"),
    nextOfKinPhone: formData.get("nextOfKinPhone"),
    relationship: formData.get("relationship"),
  };
}

function failure(error: unknown, action: string): MemberActionResult {
  if (error instanceof GoApiError) {
    console.error(`Member ${action} failed`, {
      requestId: error.requestId,
      status: error.status,
    });

    const messages: Record<number, string> = {
      400: "The backend rejected these details. Check the form and try again.",
      401: "Your session has expired. Sign in again.",
      403: "You do not have permission to perform this action.",
      404: "This member could not be found.",
      409: "This change conflicts with an existing member or the member's current state.",
      429: "Too many requests. Wait a moment and try again.",
      504: "The member service took too long to respond.",
    };

    return {ok: false, error: {
      message: `${messages[error.status] ?? "The member service is unavailable."} Reference: ${error.requestId}`,
    }};
  }

  console.error(`Unexpected member ${action} failure`, error);
  return {ok: false, error: {message: "Something went wrong. Please try again."}};
}

export async function registerMemberAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionResult> {
  const parsed = registerSchema.safeParse({
    ...profileInput(formData),
    nationalId: formData.get("nationalId"),
  });

  if (!parsed.success) {
    return {ok: false, error: {
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }};
  }

  try {
    const {nationalId, ...profileData} = parsed.data;
    const result = await registerMember({
      branchId: MEMBER_BRANCH_ID,
      nationalId,
      profile: profileFrom(profileData),
    });
    updateTag("member-directory");
    revalidatePath("/dashboard/members");
    return {ok: true, data: {
      message: `Member ${result.memberNumber} was registered successfully.`,
      memberId: result.memberId,
    }};
  } catch (error) {
    return failure(error, "registration");
  }
}

export async function updateMemberProfileAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionResult> {
  const parsed = updateProfileSchema.safeParse({
    ...profileInput(formData),
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) {
    return {ok: false, error: {
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }};
  }

  try {
    const {memberId, ...profileData} = parsed.data;
    await updateMemberProfile({memberId, profile: profileFrom(profileData)});
    updateTag("member-directory");
    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath("/dashboard/members");
    return {ok: true, data: {message: "Member profile updated."}};
  } catch (error) {
    return failure(error, "profile update");
  }
}

export async function updateMemberStatusAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionResult> {
  const parsed = z.object({
    memberId: z.string().min(1),
    newStatus: z.enum(editableStatusValues),
    reason: z.string().trim().min(5, "Provide a reason of at least 5 characters.").max(500),
  }).safeParse({
    memberId: formData.get("memberId"),
    newStatus: formData.get("newStatus"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {ok: false, error: {message: "Check the status and reason.", fieldErrors: parsed.error.flatten().fieldErrors}};
  }

  try {
    await updateMemberStatus(parsed.data);
    updateTag("member-directory");
    revalidatePath(`/dashboard/members/${parsed.data.memberId}`);
    revalidatePath("/dashboard/members");
    return {ok: true, data: {message: "Member status updated."}};
  } catch (error) {
    return failure(error, "status update");
  }
}

export async function closeMemberAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionResult> {
  const parsed = z.object({
    memberId: z.string().min(1),
    reason: z.string().trim().min(10, "Provide a closure reason of at least 10 characters.").max(500),
    confirmation: z.literal("CLOSE"),
  }).safeParse({
    memberId: formData.get("memberId"),
    reason: formData.get("reason"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return {ok: false, error: {message: "Enter a reason and type CLOSE to confirm.", fieldErrors: parsed.error.flatten().fieldErrors}};
  }

  try {
    const result = await closeMember({memberId: parsed.data.memberId, reason: parsed.data.reason});
    if (!result.success) return {ok: false, error: {message: "The backend did not confirm account closure."}};
    updateTag("member-directory");
    revalidatePath(`/dashboard/members/${parsed.data.memberId}`);
    revalidatePath("/dashboard/members");
    return {ok: true, data: {message: "Member account closed."}};
  } catch (error) {
    return failure(error, "account closure");
  }
}
