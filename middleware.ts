export { auth as middleware } from './auth'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}

// import { NextRequest, NextResponse } from 'next/server'

// export const config = {
//   matcher: '/',
// }

// export let userId : string = ""

// export function middleware(req: NextRequest) {
//   if(!userId && req.nextUrl.searchParams.has('id'))
//   {
//     userId = req.nextUrl.searchParams.get("id") ?? ""
//     console.log("userId", userId)
//     return NextResponse.redirect(req.nextUrl)
//   } 
// }

// export function getUserId() : string {
//   console.log("getUserId", userId)
//   return userId
// }