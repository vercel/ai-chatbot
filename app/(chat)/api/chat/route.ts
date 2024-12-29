import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
  type DataStreamWriter,
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

import { generateTitleFromUserMessage } from "../../actions";
import { traceable, getCurrentRunTree } from "langsmith/traceable";

import { Client as LangSmithClient } from "langsmith";

export const maxDuration = 60;
const langsmith = new LangSmithClient();

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

  const handleChatOperation = traceable(
    async ({
      messages,
      model,
      id,
      session,
    }: {
      messages: any[];
      model: any;
      id: string;
      session: any;
    }) => {
      let finalResponse: any = null;
      let streamResponse: Response | null = null;

      const stream = createDataStreamResponse({
        execute: async (dataStream: DataStreamWriter) => {
          try {
            await langchainService.initialize(session.user!.bubbleUserId);
            const result = streamText({
              model: customModel(model.apiIdentifier),
              system: `${systemPrompt}\n\n
IMPORTANT: You MUST use the searchKnowledgeBase tool before providing ANY response. This is a requirement for EVERY question.

When using search results:
1. First analyze the relevance scores of the returned content
2. Incorporate the most relevant quotes and insights into your response
3. If the search returns no relevant information, acknowledge this explicitly
4. Always maintain a natural conversational tone while weaving in the evidence
5. Cite specific quotes when they support your points

Remember: Every response should be grounded in the search results when available.`,
              messages: messages,
              maxSteps: 5,
              experimental_activeTools: ["searchKnowledgeBase"],
              experimental_telemetry: AISDKExporter.getSettings(),
              tools: {
                searchKnowledgeBase: {
                  description:
                    "REQUIRED: You MUST use this tool FIRST for EVERY question, no exceptions.",
                  parameters: z.object({
                    query: z
                      .string()
                      .describe("the exact question from the user"),
                  }),
                  execute: traceable(
                    async ({ query }) => {
                      const searchOperation = async () => {
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
                      };

                      return await searchOperation();
                    },
                    {
                      name: "searchKnowledgeBase",
                    }
                  ),
                },
              },
              onFinish: async ({ response }) => {
                if (session.user?.id) {
                  try {
                    const responseMessagesWithoutIncompleteToolCalls =
                      sanitizeResponseMessages(response.messages);

                    finalResponse = responseMessagesWithoutIncompleteToolCalls;

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
          } catch (error) {
            throw error;
          }
        },
      });

      // Clone the stream before consuming it
      const clonedResponse = stream.clone();

      // Wait for the stream to complete
      if (stream.body) {
        await stream.body.pipeTo(new WritableStream());
      }

      // Return the cloned stream response
      return {
        response: clonedResponse,
        output: finalResponse,
      };
    },
    { name: `chat-${id}` }
  );

  const { response } = await handleChatOperation({
    messages: coreMessages,
    model,
    id,
    session,
  });

  return response;
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
