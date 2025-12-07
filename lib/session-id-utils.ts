/**
 * Session ID to UUID conversion utilities (matches backend logic)
 * Uses the same SHA-256 hashing algorithm as the backend to ensure consistency
 */

const SESSION_ID_PREFIX = "session-";

/**
 * Convert a session ID to a deterministic UUID (matches backend logic)
 * Uses SHA-256 hash to generate a UUID v5-like identifier
 */
export async function sessionIdToUuid(sessionId: string): Promise<string> {
  if (!sessionId.startsWith(SESSION_ID_PREFIX)) {
    throw new Error(`sessionId must start with '${SESSION_ID_PREFIX}'`);
  }

  // Use Web Crypto API for SHA-256 (available in Node.js and browsers)
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);

  // Take first 16 bytes
  const uuidBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    uuidBytes[i] = hashArray[i];
  }

  // Set version to 5 and variant bits (same as backend)
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x50; // Version 5
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to UUID string format
  const hex = Array.from(uuidBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Check if a session ID's UUID matches a chat's userId
 */
export async function sessionIdMatchesChatUserId(
  sessionId: string,
  chatUserId: string
): Promise<boolean> {
  try {
    const sessionUuid = await sessionIdToUuid(sessionId);
    return sessionUuid === chatUserId;
  } catch {
    return false;
  }
}
