import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "@/app/[locale]/(auth)/auth.config";

import { locales } from "@/lib/i18n/routing";
const publicRoutes = ["/", "/login", "/register"];
locales.forEach((locale) => publicRoutes.push(`/${locale}`,`/${locale}/login`,`/${locale}/register`));

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "en",
});

const auth = NextAuth(authConfig).auth;

const authMiddleware = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api');
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  console.log(isApiAuthRoute)
  // Handle different route scenarios
  if (isApiAuthRoute) return; // Don't modify API authentication routes

  // Handle different route scenarios
  if (!isPublicRoute) {
    if (isLoggedIn) {
      // Redirect logged-in users from auth routes
      //return Response.redirect(new URL('/', nextUrl));
    }
    return; // Don't modify behavior for auth routes
  }

  if (!isLoggedIn && !isPublicRoute) {
    // Redirect unauthorized users to login for non-public routes
    return Response.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn) {
    return intlMiddleware(req); // Apply internationalization for logged-in users
  }
});

export default function middleware(req: NextRequest) {
  const isPublicRoute = publicRoutes.includes(req.nextUrl);

  if (isPublicRoute) {
    return intlMiddleware(req); // Apply internationalization for public pages
  } else {
    return (authMiddleware as any)(req); // Apply authentication logic for non-public pages
  }
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(af|de|en|es|fr|ga|hi|it|nl|pl|pt|zu)/:path*',

    "/:id",
    "/api/:path*",
    "/login",
    "/register",

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};

/*
export const config = {
  matcher: ["/", '/(de|en)', '/(de|en)/:path*', "/:id", "/api/:path*", "/login", "/register"],
};
*/