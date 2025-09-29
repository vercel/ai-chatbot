import type { NextRequest } from "next/server";
import { withAuthApi } from "@/lib/auth/route-guards";
import { getChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export const GET = withAuthApi(async ({ request, session }) => {
  const nextRequest = request as unknown as NextRequest;
  const { searchParams } = nextRequest.nextUrl;

  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}, {
  onUnauthorized: () => new ChatSDKError("unauthorized:chat").toResponse(),
});
