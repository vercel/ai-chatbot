import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId } from "@/lib/db/queries";
import type { Chat } from "@/lib/db/schema";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const endingBefore = searchParams.get("ending_before");

  try {
    const result = await getChatsByUserId({
      id: session.user.id,
      limit,
      startingAfter: null,
      endingBefore: endingBefore || null,
    });

    return Response.json({
      chats: result.chats,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
