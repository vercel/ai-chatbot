import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";
import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";
import {
  resolveTenantContext,
  getAppMode,
} from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set workspace ID header for tenant context resolution
  const mode = getAppMode();
  const requestHeaders = new Headers(request.headers);

  let workspaceId =
    requestHeaders.get("x-workspace-id") ??
    request.cookies.get("workspace_id")?.value ??
    request.nextUrl.searchParams.get("workspaceId") ??
    null;

  if (mode === "local") {
    workspaceId =
      workspaceId ??
      process.env.DEFAULT_WORKSPACE_ID ??
      process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID ??
      null;
  }

  if (workspaceId) {
    requestHeaders.set("x-workspace-id", workspaceId);
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle Supabase auth routes
  const isSupabaseAuthRoute =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/otp") ||
    pathname.startsWith("/onboarding");

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // Handle Supabase auth routes
  if (isSupabaseAuthRoute) {
    // Allow access to auth pages
    return supabaseResponse;
  }

  // For protected routes, check Supabase auth first
  if (supabaseUser) {
    // User is authenticated via Supabase
    // Check onboarding status for protected routes
    // Exclude API routes needed during onboarding (e.g., workspace slug check)
    const isOnboardingApiRoute = pathname.startsWith("/api/workspace/check-slug");
    if (
      pathname !== "/signin" &&
      pathname !== "/otp" &&
      pathname !== "/onboarding" &&
      !isOnboardingApiRoute
    ) {
      try {
        const mode = getAppMode();
        
        if (mode === "hosted") {
          // In hosted mode, user is a system table in main database
          const sql = postgres(process.env.POSTGRES_URL!);
          const db = drizzle(sql);
          
          try {
            const [userRecord] = await db
              .select()
              .from(user)
              .where(eq(user.id, supabaseUser.id))
              .limit(1);

            if (userRecord && !userRecord.onboarding_completed) {
              const url = request.nextUrl.clone();
              url.pathname = "/onboarding";
              return NextResponse.redirect(url);
            }
          } finally {
            await sql.end({ timeout: 5 });
          }
        } else {
          // Local mode: use resource store
          const tenant = await resolveTenantContext({
            headers: requestHeaders,
          });
          const store = await getResourceStore(tenant);
          try {
            const [userRecord] = await store.withSqlClient((db) =>
              db
                .select()
                .from(user)
                .where(eq(user.id, supabaseUser.id))
                .limit(1)
            );

            if (userRecord && !userRecord.onboarding_completed) {
              const url = request.nextUrl.clone();
              url.pathname = "/onboarding";
              return NextResponse.redirect(url);
            }
          } finally {
            await store.dispose();
          }
        }
      } catch {
        // If database check fails, allow the request to proceed
        // Individual pages will handle the check
      }
    }

    // Supabase user is authenticated and onboarding is complete (or not required)
    return supabaseResponse;
  }

  // Fall back to NextAuth for existing routes
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    // If no Supabase user and no NextAuth token, allow root route for marketing page
    // Otherwise redirect to signin for protected routes
    if (!isSupabaseAuthRoute && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/signin",
    "/otp",
    "/onboarding",
    "/dashboard",
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
