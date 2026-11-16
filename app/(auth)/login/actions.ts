"use server";

import { GoApiError, goApiGet } from "@/lib/server/go-api";

// checkStaffAccess confirms backend access after Better Auth creates a session.
export async function checkStaffAccess() {
  try {
    await goApiGet("/api/v1/auth/current-staff");
    return "active";
  } catch (error) {
    if (error instanceof GoApiError && error.status === 401) return "denied";
    return "unavailable";
  }
}
