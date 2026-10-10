import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth";
import type {
  CreateStaffUserRequest,
  CreateStaffUserResponse,
} from "@/lib/go-api-client";

const GO_API_URL =
  process.env.GO_API_URL ??
  process.env.CARITAS_BACKEND_URL ??
  "http://localhost:8080";

export class GoApiError extends Error {
  constructor(
    readonly status: number,
    readonly requestId: string,
    options?: ErrorOptions,
    readonly code?: number,
    readonly detail?: string,
  ) {
    super("The Go API request failed.", options);
    this.name = "GoApiError";
  }
}

// getAuthorization avoids repeating session and token work during one server render.
const getAuthorization = cache(async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return undefined;
  }

  const result = await auth.api.getToken({ headers: requestHeaders });
  const token = result.token?.trim();

  if (!token) {
    return undefined;
  }

  return `Bearer ${token}`;
});

export async function goApiPost<T>(
  path: string,
  body: unknown,
  method = "POST",
): Promise<T> {
  const requestId = randomUUID();
  const authorization = await getAuthorization();

  if (!authorization) {
    throw new GoApiError(401, requestId);
  }
  let response: Response;

  try {
    response = await fetch(`${GO_API_URL}${path}`, {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const status =
      error instanceof DOMException && error.name === "TimeoutError"
        ? 504
        : 502;
    throw new GoApiError(status, requestId, { cause: error });
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const error =
      body && typeof body === "object"
        ? (body as { code?: unknown; message?: unknown })
        : undefined;
    const code = typeof error?.code === "number" ? error.code : undefined;
    // Only domain validation messages are exposed; removing this guard can leak internal server details.
    const detail =
      [3, 5, 6, 9].includes(code ?? 0) && typeof error?.message === "string"
        ? error.message
        : undefined;
    throw new GoApiError(
      response.status,
      response.headers.get("X-Request-ID") || requestId,
      undefined,
      code,
      detail,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new GoApiError(502, requestId, { cause: error });
  }
}

export function createStaffUser(input: CreateStaffUserRequest) {
  return goApiPost<CreateStaffUserResponse>(
    "/api/v1/auth/create-staff-user",
    input,
  );
}

// goApiGet shares authentication and error handling with mutations; removing it duplicates that boundary for cash reads.
export const goApiGet = (path: string): Promise<unknown> =>
  goApiPost<unknown>(path, undefined, "GET");
