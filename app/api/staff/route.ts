import { GoApiError, goApiGet } from "@/lib/server/go-api";

// GET keeps the Go permission boundary between the browser and the staff directory.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  for (const key of ["query", "role", "page_token"]) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }
  params.set("page_size", "25");
  try {
    const result = await goApiGet(`/api/v1/auth/staff-users?${params}`);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof GoApiError && error.status === 403
            ? "You do not have permission to manage staff access."
            : "Staff records could not be loaded.",
      },
      { status: error instanceof GoApiError ? error.status : 500 },
    );
  }
}
