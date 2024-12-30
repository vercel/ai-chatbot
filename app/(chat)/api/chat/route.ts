import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
} from "ai";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { customModel } from "@/lib/ai";
import { models } from "@/lib/ai/models";
import { langchainService } from "@/lib/langchain/service";
import { AISDKExporter } from "langsmith/vercel";
import { systemPrompt } from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";
import { traceable } from "langsmith/traceable";
import { generateTitleFromUserMessage } from "../../actions";

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response("Model not found", { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  // TODO: Traceable works to nest all the runs together, but it doesnt get the inputs and outputs as well as the latency on the parent run.
  // The reason is becuase we are streaming the response and langsmith doesnt work with traceable streaming.
  // I can just use the experimental_telemetry but then it breaks it into multiple runs which is harder to see.
  // It works by making steps manually but then you miss details.
  // Tried sentry logging but that didnt work either.
  // Will need to wait and see if langsmith supports streaming with traceable.
  // Opened issue here: https://github.com/vercel/ai/issues/4223

  const chatOperation = traceable(
    async () => {
      return createDataStreamResponse({
        execute: async (dataStream) => {
          await langchainService.initialize(session.user!.bubbleUserId);
          const result = streamText({
            model: customModel(model.apiIdentifier),
            system: systemPrompt,
            messages: coreMessages,
            maxSteps: 5,
            experimental_activeTools: ["searchKnowledgeBase"],
            experimental_telemetry: AISDKExporter.getSettings({}),
            tools: {
              searchKnowledgeBase: {
                description:
                  "REQUIRED: You MUST use this tool FIRST for EVERY question, no exceptions.",
                parameters: z.object({
                  query: z
                    .string()
                    .describe("the exact question from the user"),
                }),
                execute: async ({ query }) => {
                  const searchOperation = traceable(
                    async () => {
                      console.log("🔍 Searching knowledge base for:", query);
                      const results = await langchainService.similaritySearch(
                        query
                      );

                      return {
                        results: results.map((doc) => ({
                          content: doc.metadata?.text || doc.pageContent,
                          score: Math.round(doc.score * 100),
                        })),
                        sourceCount: results.length,
                        hasResults: results.length > 0,
                      };
                    },
                    { name: "search-knowledge-base" }
                  )();

                  return await searchOperation;
                },
              },
            },
            onFinish: async ({ response }) => {
              if (session.user?.id) {
                try {
                  const responseMessagesWithoutIncompleteToolCalls =
                    sanitizeResponseMessages(response.messages);

                  await saveMessages({
                    messages: responseMessagesWithoutIncompleteToolCalls.map(
                      (message) => {
                        const messageId = generateUUID();
                        if (message.role === "assistant") {
                          dataStream.writeMessageAnnotation({
                            messageIdFromServer: messageId,
                          });
                        }
                        return {
                          id: messageId,
                          chatId: id,
                          role: message.role,
                          content: message.content,
                          createdAt: new Date(),
                        };
                      }
                    ),
                  });
                } catch (error) {
                  console.error("Failed to save chat:", error);
                }
              }
            },
          });
          await result.mergeIntoDataStream(dataStream);
        },
      });
    },
    {
      name: `chat-${id}`,
      inputs: {
        messages: coreMessages,
      },
      metadata: {
        chatId: id,
        userId: session.user.id,
        email: session.user.email,
        model: model.apiIdentifier,
      },
    }
  );

  return await chatOperation();
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
