import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";
import { trackEvent } from "./lib/analytics/events";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

// Simple pattern matcher supporting exact and prefix patterns ending with /*
function matchPattern(pattern: string, pathname: string): boolean {
  const p = pattern.trim();
  if (!p) return false;
  if (p.endsWith("/*")) {
    const base = p.slice(0, -2);
    return pathname === base || pathname.startsWith(base + "/");
  }
  return pathname === p || pathname.startsWith(p + "/");
}

function getAllowlistFromEnv(): string[] {
  const v = process.env.AUTH_ALLOWLIST || "";
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export function isAllowedPath(pathname: string): boolean {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  // Built-in allow for CI/test
  if ((env === "test" || env === "ci") && (
    pathname.startsWith("/api/monitoring/") ||
    pathname.startsWith("/api/omni/") ||
    pathname.startsWith("/ping")
  )) {
    return true;
  }
  // Allowlist via env in any env (careful in prod)
  const allow = getAllowlistFromEnv();
  return allow.some((pat) => matchPattern(pat, pathname));
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === "/") {
		trackEvent("app_open", {
			device_id: request.headers.get("user-agent") ?? "unknown",
			source: request.headers.get("referer") ?? "direct",
			timestamp: new Date().toISOString(),
		});
	}

	/*
	 * Playwright starts the dev server and requires a 200 status to
	 * begin the tests, so this ensures that the tests can start
	 */
	if (pathname.startsWith("/ping")) {
		return new Response("pong", { status: 200 });
	}

	if (pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	// Bypass when allowed by env or test/ci mode
	if (isAllowedPath(pathname)) {
		return NextResponse.next();
	}

	const token = await getToken({
		req: request,
		secret: process.env.AUTH_SECRET,
		secureCookie: !isDevelopmentEnvironment,
	});

	if (!token) {
		const redirectUrl = encodeURIComponent(request.url);

		return NextResponse.redirect(
			new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
		);
	}

	const isGuest = guestRegex.test(token?.email ?? "");

	if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/",
		"/chat/:id",
		"/api/:path*",
		"/login",
		"/register",

		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
