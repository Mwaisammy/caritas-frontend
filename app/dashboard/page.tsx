import { redirect } from "next/navigation";

// DashboardIndex keeps existing sign-in links pointed at the main dashboard.
export default function DashboardIndex() {
  redirect("/dashboard/main");
}
