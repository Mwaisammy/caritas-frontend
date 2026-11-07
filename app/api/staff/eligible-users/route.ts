import { ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { GoApiError, goApiGet } from "@/lib/server/go-api";

// GET uses the Go staff permission before exposing searchable Better Auth identities.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return Response.json(
      { message: "Enter at least two characters." },
      { status: 400 },
    );
  }

  try {
    await goApiGet("/api/v1/auth/staff-users?page_size=1");

    const escaped = query.replace(/[\\%_]/g, "\\$&");
    const users = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(
        or(ilike(user.name, `%${escaped}%`), ilike(user.email, `%${escaped}%`)),
      )
      .limit(20);
    return Response.json(
      { users },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof GoApiError) {
      return Response.json(
        { message: "Staff lookup is unavailable." },
        { status: error.status },
      );
    }
    return Response.json(
      { message: "Staff lookup is unavailable." },
      { status: 500 },
    );
  }
}
