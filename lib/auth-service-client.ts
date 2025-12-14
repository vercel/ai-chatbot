/**
 * Client-side authentication functions.
 * Safe to import in client components.
 */

import { getApiUrl } from "./api-client";

export type UserType = "guest" | "regular";

export type User = {
  id: string;
  email: string | null;
  type: UserType;
};

/**
 * Client-side logout function.
 * Calls Next.js logout route handler which ensures cookies are properly cleared
 * before navigation. This is more robust than calling FastAPI directly.
 */
export async function logoutClient(): Promise<void> {
  // Use Next.js API route which handles cookie clearing server-side
  const apiUrl = getApiUrl("/api/auth/logout");
  const response = await fetch(apiUrl, {
    method: "POST",
    credentials: "include", // Important: include cookies
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  // Cookies are cleared by the server-side route handler
  // The response includes Set-Cookie headers to delete cookies
}
