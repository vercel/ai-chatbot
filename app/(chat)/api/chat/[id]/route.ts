import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { isAuthDisabled } from "@/lib/constants";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { sessionIdMatchesChatUserId } from "@/lib/session-id-utils";

/**
 * GET /api/chat/[id]
 * Get a chat by ID with its messages.
 * This is a fallback route when FastAPI is not enabled.
 * When FastAPI is enabled, requests are routed to the backend.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const cookieStore = await request.cookies;

  // Only allow if auth is enabled and session exists, or auth is disabled
  if (!isAuthDisabled && !session) {
    return NextResponse.json(
      { code: "unauthorized:chat", cause: "Not authenticated" },
      { status: 401 }
    );
  }

  // Get chat
  const chat = await getChatById({ id });
  if (!chat) {
    return NextResponse.json(
      { code: "not_found:chat", cause: "Chat not found" },
      { status: 404 }
    );
  }

  // Check access permissions
  let isOwner = false;

  if (chat.visibility === "private") {
    if (isAuthDisabled) {
      const sessionId = cookieStore.get("session_id")?.value;
      if (!sessionId) {
        return NextResponse.json(
          { code: "forbidden:chat", cause: "Access denied" },
          { status: 403 }
        );
      }
      isOwner = await sessionIdMatchesChatUserId(sessionId, chat.userId);
      if (!isOwner) {
        return NextResponse.json(
          { code: "forbidden:chat", cause: "Access denied" },
          { status: 403 }
        );
      }
    } else {
      if (!session?.user) {
        return NextResponse.json(
          { code: "forbidden:chat", cause: "Access denied" },
          { status: 403 }
        );
      }
      isOwner = session.user.id === chat.userId;
      if (!isOwner) {
        return NextResponse.json(
          { code: "forbidden:chat", cause: "Access denied" },
          { status: 403 }
        );
      }
    }
  } else {
    // For public chats, check ownership for readonly
    if (isAuthDisabled) {
      const sessionId = cookieStore.get("session_id")?.value;
      if (sessionId) {
        isOwner = await sessionIdMatchesChatUserId(sessionId, chat.userId);
      }
    } else {
      isOwner = session?.user?.id === chat.userId;
    }
  }

  // Get messages
  const messages = await getMessagesByChatId({ id });

  // Convert to response format matching backend API
  return NextResponse.json({
    chat: {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      visibility: chat.visibility,
      userId: chat.userId,
      lastContext: chat.lastContext,
    },
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts,
      attachments: msg.attachments,
      createdAt: msg.createdAt.toISOString(),
    })),
    isOwner,
  });
}
