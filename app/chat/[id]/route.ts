import { NextResponse } from "next/server";

// This route handler is created to handle Next.js server action POST requests
// that are made from the dynamic chat page (/chat/[id]).
// Without this, server actions on this page will fail with a 404 error.
export async function POST() {
  // The actual server action logic is handled by the Next.js server action middleware.
  // This route handler simply needs to exist to catch the POST request
  // and return a response. The server action will have already been executed
  // by the time this handler is reached.
  return NextResponse.json({ status: "ok" });
}
