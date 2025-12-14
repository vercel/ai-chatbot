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
 * Calls FastAPI logout endpoint and clears cookie.
 */
export async function logoutClient(): Promise<void> {
  const apiUrl = getApiUrl("/api/auth/logout");
  await fetch(apiUrl, {
    method: "POST",
    credentials: "include", // Important: include cookies
  });
  // Cookie is cleared by FastAPI response
}
