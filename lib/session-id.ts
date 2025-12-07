/**
 * Session ID Manager
 *
 * Generates and persists a session ID for user tracking when authentication is disabled.
 * The session ID is stored in localStorage for persistence across page reloads.
 */

const SESSION_ID_KEY = "session_id";
const SESSION_ID_PREFIX = "session-";

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${SESSION_ID_PREFIX}${timestamp}-${random}`;
}

/**
 * Set session ID in cookie (for server-side access)
 */
function setSessionIdCookie(sessionId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  try {
    // Set cookie that expires in 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${SESSION_ID_KEY}=${sessionId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch {
    // Ignore errors setting cookie
  }
}

/**
 * Get or create a session ID
 * If no session ID exists in localStorage, creates a new one and stores it
 * Also stores it in a cookie for server-side access
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    // Server-side: return a placeholder (should read from cookie instead)
    return `${SESSION_ID_PREFIX}server`;
  }

  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);

    if (sessionId) {
      // Ensure cookie is also set (in case it was cleared)
      setSessionIdCookie(sessionId);
    } else {
      sessionId = generateSessionId();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      // Also store in cookie for server-side access
      setSessionIdCookie(sessionId);
    }

    return sessionId;
  } catch (error) {
    // localStorage might be disabled or unavailable
    // Fallback to sessionStorage or generate a temporary ID
    try {
      let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      }
      setSessionIdCookie(sessionId);
      return sessionId;
    } catch {
      // Last resort: generate a temporary ID (won't persist)
      const sessionId = generateSessionId();
      setSessionIdCookie(sessionId);
      return sessionId;
    }
  }
}

/**
 * Clear the session ID (useful for testing or logout)
 */
export function clearSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if a string is a valid session ID format
 */
export function isValidSessionId(id: string): boolean {
  return id.startsWith(SESSION_ID_PREFIX);
}
