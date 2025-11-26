import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getChatById, saveChat, saveMessages } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { generateTitleFromUserMessage } from "../../../actions";

const webllmSaveSchema = z.object({
  chatId: z.string().uuid(),
  messages: z.array(
    z.object({
      id: z.string().uuid(),
      role: z.enum(["user", "assistant"]),
      parts: z.array(z.any()),
      createdAt: z.string().or(z.date()).optional(),
    })
  ),
  visibility: z.enum(["public", "private"]).optional().default("private"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { chatId, messages, visibility } = webllmSaveSchema.parse(json);

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const chat = await getChatById({ id: chatId });

    if (!chat) {
      const userMessage = messages.find((m) => m.role === "user");
      if (userMessage) {
        const title = await generateTitleFromUserMessage({
          message: userMessage as any,
        });

        await saveChat({
          id: chatId,
          userId: session.user.id,
          title,
          visibility,
        });
      }
    } else if (chat.userId !== session.user.id) {
      return new ChatSDKError("forbidden:chat").toResponse();
    }

    await saveMessages({
      messages: messages.map((msg) => ({
        id: msg.id,
        chatId,
        role: msg.role,
        parts: msg.parts,
        attachments: [],
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      })),
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Error saving WebLLM messages:", error);
    return new ChatSDKError("bad_request:api").toResponse();
  }
}
