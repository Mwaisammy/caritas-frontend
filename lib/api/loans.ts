import "server-only";

import type { Loan } from "../../app/types/loans";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {cacheLife, cacheTag} from "next/cache";

const API_URL = process.env.CARITAS_BACKEND_URL;

export interface ListLoansResponse {
  loans: Loan[];
  next_page_token?: string;
}

export async function getLoans(): Promise<ListLoansResponse> {
  "use cache: private";
  cacheLife({stale: 30, revalidate: 60, expire: 300});
  cacheTag("loan-directory");

  if (!API_URL) {
    throw new Error("CARITAS_BACKEND_URL is not configured");
  }

  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    throw new Error("You must be signed in to fetch loans");
  }

  const { token } = await auth.api.getToken({
    headers: requestHeaders,
  });

  if (!token) {
    throw new Error("Failed to create a backend access token");
  }

  const response = await fetch(
    `${API_URL}/api/v1/loans/list`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 50,
      }),
    },
  );

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      body &&
      typeof body === "object" &&
      "message" in body
        ? String(body.message)
        : `HTTP ${response.status}`;

    throw new Error(
      `Failed to fetch loans: ${backendMessage}`,
    );
  }

  return body as ListLoansResponse;
}
