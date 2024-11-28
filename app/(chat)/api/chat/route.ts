import {
  type Message,
  StreamData,
  //convertToCoreMessages,
  //streamObject,
  streamText,
} from "ai";
//import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { customModel } from "@/lib/ai";
//import { models } from "@/lib/ai/models";
//import { systemPrompt } from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  //getDocumentById,
  //saveChat,
  //saveDocument,
  saveMessages,
  //saveSuggestions,
} from "@/lib/db/queries";
//import type { Suggestion } from "@/lib/db/schema";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";

//import { generateTitleFromUserMessage } from "../../actions";
import { getHuggingFaceEmbeddings } from "@/lib/ai/embeddings";
import { getPineconeClient } from "@/lib/ai/pinecone";

export const maxDuration = 60;

const namespaces = [
  "https://github.com/Brianleach11/PetConnect",
  "https://github.com/Brianleach11/SecureAgent",
  "https://github.com/Brianleach11/ai-chatbot",
  "https://github.com/Brianleach11/Brain_Tumor_Classification",
  "https://github.com/Brianleach11/discord",
  "https://github.com/Brianleach11/Churn_Predictor",
  "https://github.com/Brianleach11/Client_Delivery",
];

type AllowedTools =
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "getWeather";

const blocksTools: AllowedTools[] = [
  "createDocument",
  "updateDocument",
  "requestSuggestions",
];

const weatherTools: AllowedTools[] = ["getWeather"];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  try {
    console.log('🟦 Starting POST request');
    
    const { messages, id }: { messages: Array<Message>; id: string } =
      await request.json();
    console.log('📨 Received request data:', { messageCount: messages.length, chatId: id });

    const session = await auth();
    console.log('🔐 Auth session:', { 
      authenticated: !!session, 
      userId: session?.user?.id 
    });

    if (!session || !session.user || !session.user.id) {
      console.log('❌ Authentication failed');
      return new Response("Unauthorized", { status: 401 });
    }

    const lastMessage = getMostRecentUserMessage(messages);
    console.log('💭 Last user message:', lastMessage?.content);

    if (!lastMessage) {
      console.log('❌ No user message found');
      return new Response("No user message found", { status: 400 });
    }

    console.log('🔄 Getting embeddings for message');
    const queryEmbedding = await getHuggingFaceEmbeddings(lastMessage.content);
    console.log('✅ Embeddings generated');

    console.log('🔄 Connecting to Pinecone');
    const pinecone = await getPineconeClient();
    console.log('✅ Pinecone client ready');

    console.log('🔄 Querying all namespaces');
    const namespaceResults = await Promise.all(
      namespaces.map(async (namespace) => {
        console.log(`  📍 Querying namespace: ${namespace}`);
        const testIndex = pinecone.Index("codebase-rag").namespace(namespace);
        const queryResponse = await testIndex.query({
          vector: queryEmbedding,
          topK: 3,
          includeMetadata: true,
        });

        const averageScore =
          queryResponse.matches.reduce(
            (acc, match) => acc + (match.score || 0),
            0
          ) / queryResponse.matches.length;

        console.log(`  📊 Average score for ${namespace}: ${averageScore}`);
        return {
          namespace,
          score: averageScore,
          matches: queryResponse.matches,
        };
      })
    );

    const bestNamespaceResult = namespaceResults.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    console.log('🏆 Best matching namespace:', {
      namespace: bestNamespaceResult.namespace,
      score: bestNamespaceResult.score
    });

    const contexts = bestNamespaceResult.matches.map(
      (match) => match.metadata?.text || ""
    );
    console.log('📚 Retrieved contexts:', {
      count: contexts.length
    });

    const augmentedQuery = `
      <CONTEXT>
      ${contexts.join("\n\n-------\n\n")}
      </CONTEXT>

      MY QUESTION:
      ${lastMessage.content}`;
    console.log('📝 Created augmented query');

    const systemPrompt = `You are a Senior Software Engineer, specializing in codebase-specific questions.
      Answer any questions about the codebase, based on the code provided in the context.
      Always consider all of the context provided when forming a response.
      If the context doesn't contain relevant information, say so.`;

    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(0, -1).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: augmentedQuery },
    ];

    const initialUserMessage = {
      ...lastMessage,
      id: generateUUID(),
      createdAt: new Date(),
      chatId: id,
    };

    await saveMessages({
      messages: [initialUserMessage],
    });

    const streamingData = new StreamData();

    console.log('🤖 Calling LLM with streamText');
    const result = await streamText({
      model: customModel("groq/llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: llmMessages,
      maxSteps: 5,
      onFinish: async ({ responseMessages }) => {
        console.log('✨ Stream finished, processing response messages');
        if (session.user?.id) {
          try {
            console.log('🔄 Sanitizing response messages');
            const responseMessagesWithoutIncompleteToolCalls =
              sanitizeResponseMessages(responseMessages);

            console.log('💾 Saving messages to database');
            await saveMessages({
              messages: responseMessagesWithoutIncompleteToolCalls.map(
                (message) => {
                  const messageId = generateUUID();
                  console.log(`  📝 Processing message: ${message.role}`);

                  if (message.role === 'assistant') {
                    console.log(`  🏷️ Appending message annotation: ${messageId}`);
                    streamingData.appendMessageAnnotation({
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
                },
              ),
            });
            console.log('✅ Messages saved successfully');
          } catch (error) {
            console.error('❌ Failed to save chat:', error);
          }
        }

        console.log('👋 Closing stream');
        streamingData.close();
      },
    });

    console.log('🔄 Converting to data stream response');
    const response = result.toDataStreamResponse({
      data: streamingData,
    });
    console.log('✅ Response ready to send');

    return response;

  } catch (error) {
    console.error("❌ Error in chat route:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
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
