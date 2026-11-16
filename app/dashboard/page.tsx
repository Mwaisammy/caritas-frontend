import { redirect } from "next/navigation";

// This redirect-only page has no UI for Instant Navigation to validate.
export const instant = false;

// DashboardIndex keeps existing sign-in links pointed at the main dashboard.
export default function DashboardIndex() {
  redirect("/dashboard/main");
}
