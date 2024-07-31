

import { EnrichedSession, auth } from "@/auth";

export async function GET(request: Request) {
  const session = (await auth()) as EnrichedSession;
  return Response.json(session);


}
