// import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { type NextRequest, NextResponse } from 'next/server';

// export async function updateSession(request: NextRequest) {
//   let supabaseResponse = NextResponse.next({
//     request,
//   });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             request.cookies.set(name, value),
//           );
//           supabaseResponse = NextResponse.next({
//             request,
//           });
//           cookiesToSet.forEach(({ name, value, options }) =>
//             supabaseResponse.cookies.set(name, value, options),
//           );
//         },
//       },
//     },
//   );

//   // IMPORTANT: Avoid writing any logic between createServerClient and
//   // supabase.auth.getUser(). A simple mistake could make it very hard to debug
//   // issues with users getting randomly logged out.

//   // Remove the getUser call as it's no longer necessary with Clerk middleware
//   // const { data: { user }, error } = await supabase.auth.getUser();

//   // if (error) {
//   //   console.error('Error getting user in Supabase middleware:', error);
//   //   // Handle error appropriately, maybe redirect to an error page or login
//   // }

//   // // if (!user && !request.nextUrl.pathname.startsWith('/login')) {
//   // //   // no user, potentially respond by redirecting the user to the login page
//   // //   const url = request.nextUrl.clone();
//   // //   url.pathname = '/login';
//   // //   return NextResponse.redirect(url);
//   // // }

//   return supabaseResponse;
// }

// --- This file might be entirely removable if not used elsewhere ---
// For now, just commenting out the Supabase-specific logic.
// If this file IS removed, ensure `middleware.ts` doesn't import `updateSession`.

// Placeholder export to avoid breaking imports if the file is kept temporarily
export async function updateSession(request: any) {
  console.warn(
    'updateSession from lib/supabase/middleware.ts called but is deprecated. Use Clerk middleware instead.',
  );
  return request; // Or return appropriate NextResponse if needed by calling code
}
