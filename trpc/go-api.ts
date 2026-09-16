import type {
  CreateStaffUserRequest,
  CreateStaffUserResponse,
  ListMembersRequest,
  ListMembersResponse,
} from "@/lib/go-api-client";
import { TRPCError } from "@trpc/server";

const GO_API_URL =
  process.env.GO_API_URL ??
  process.env.CARITAS_BACKEND_URL ??
  "http://localhost:50051";



  const statusCodeMap = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "TIMEOUT",
  409: "CONFLICT",
  429: "TOO_MANY_REQUESTS",
} as const;



async function request<T>(authorization: string, requestId: string | null, path: string, init :RequestInit): Promise<T> {
    const headers = new Headers(init.headers);

    headers.set("Authorization", authorization);
    headers.set("Content-Type", "application/json");

  if (requestId) headers.set("X-Request-ID", requestId);

  const response = await fetch(`${GO_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers,
    signal: AbortSignal.timeout(10_000)
  });

    const body = response.status === 204 ? undefined : await response.json();
    console.log(body)

     if (!response.ok) {
    const code = statusCodeMap[response.status as keyof typeof statusCodeMap] ?? "BAD_GATEWAY";
    throw new TRPCError({
      code,
      message: body?.message ?? body?.error ?? `Go API request failed with status ${response.status}`,
    });
  }
  return body as T;
};


// GO apis go here

export const goApi = {
  createStaffUser: (authorization: string, requestId: string | null, input: CreateStaffUserRequest) =>
    request<CreateStaffUserResponse>(authorization, requestId, "/api/v1/auth/create-staff-user", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listMembers: (authorization: string, requestId: string | null, input: ListMembersRequest) =>
    request<ListMembersResponse>(authorization, requestId, "/api/v1/members/list", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
