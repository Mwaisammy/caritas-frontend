import "server-only";

import {randomUUID} from "node:crypto";
import {headers} from "next/headers";

import {auth} from "@/lib/auth";
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
  ) {
    super("The Go API request failed.", options);
    this.name = "GoApiError";
  }
}

async function getAuthorization(requestId: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({headers: requestHeaders});

  if (!session) {
    throw new GoApiError(401, requestId);
  }

  const result = await auth.api.getToken({headers: requestHeaders});
  const token = result.token?.trim();

  if (!token) {
    throw new GoApiError(401, requestId);
  }

  return `Bearer ${token}`;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const requestId = randomUUID();
  const authorization = await getAuthorization(requestId);
  let response: Response;

  try {
    response = await fetch(`${GO_API_URL}${path}`, {
      method: "POST",
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
      error instanceof DOMException && error.name === "TimeoutError" ? 504 : 502;
    throw new GoApiError(status, requestId, {cause: error});
  }

  if (!response.ok) {
    throw new GoApiError(response.status, requestId);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new GoApiError(502, requestId, {cause: error});
  }
}

export function createStaffUser(input: CreateStaffUserRequest) {
  return post<CreateStaffUserResponse>(
    "/api/v1/auth/create-staff-user",
    input,
  );
}
