import { NextRequest, NextResponse } from 'next/server'
import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";

import { authConfig } from "@/app/[locale]/(auth)/auth.config";
import { locales } from "@/lib/i18n/routing";

const PUBLIC_FILE = /\.(.*)$/
const publicRoutes = ["/", "/login", "/register"];
locales.forEach((locale) => publicRoutes.push(`/${locale}`,`/${locale}/login`,`/${locale}/register`));
const auth = NextAuth(authConfig).auth;

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "en",
});
 
//Function to call against all authorised routes
const authMiddleware = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Handle different route scenarios
  if (isApiRoute) {
    return; // Don't modify API authentication routes
  }

  // Handle different route scenarios
  if (!isPublicRoute) {
    if (isLoggedIn) {
      // Redirect logged-in users from auth routes
      return Response.redirect(new URL('/', nextUrl));
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

export async function middleware(req: NextRequest) {
  const isNextJsRoute = req.nextUrl.pathname.startsWith('/_next')
  const isApiRoute = req.nextUrl.pathname.includes('/api/')
  const isPublicFile = PUBLIC_FILE.test(req.nextUrl.pathname)
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

  if (isNextJsRoute || isApiRoute || isPublicFile) {
    return
  }
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

    "/api/:path*",

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(af|de|en|es|fr|ga|hi|it|nl|pl|pt|zu)/:path*',

    "/:id",
    "/login",
    "/register",

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};
