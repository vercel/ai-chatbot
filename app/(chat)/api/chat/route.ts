import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import type { ChatModel } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // AI SDK v5: useChat sends messages array directly
    const { messages, selectedChatModel }: {
      messages: UIMessage[];
      selectedChatModel?: ChatModel["id"];
    } = json;

    if (!messages || !Array.isArray(messages)) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const uiMessages = messages as ChatMessage[];
    const modelId: ChatModel["id"] = selectedChatModel || "chat-model";

    // Get geolocation for Indonesian context
    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Use AI SDK v5 streamText with toUIMessageStreamResponse
    const result = streamText({
      model: myProvider.languageModel(modelId),
      system: systemPrompt({ selectedChatModel: modelId, requestHints }),
      messages: convertToModelMessages(uiMessages),
      stopWhen: stepCountIs(5),
      activeTools:
        modelId === "chat-model-reasoning"
          ? []
          : [
              "getWeather",
              "createDocument",
              "updateDocument",
              "requestSuggestions",
            ],
      experimental_transform: smoothStream({ chunking: "word" }),
      tools: {
        getWeather,
        // Stateless tools - dataStream will be provided by streamText internally
        createDocument: createDocument({ 
          session: null,
          dataStream: null, // Will be provided by streamText
        }),
        updateDocument: updateDocument({ 
          session: null,
          dataStream: null, // Will be provided by streamText
        }),
        requestSuggestions: requestSuggestions({
          session: null,
          dataStream: null, // Will be provided by streamText
        }),
      },
      experimental_telemetry: {
        isEnabled: isProductionEnvironment,
        functionId: "stream-text",
      },
      onFinish: async ({ usage }) => {
        try {
          const providers = await getTokenlensCatalog();
          const modelIdString =
            myProvider.languageModel(modelId).modelId;
          if (!modelIdString || !providers) {
            return;
          }

          const summary = getUsage({ modelId: modelIdString, usage, providers });
          // Usage tracking can be logged but not persisted in stateless app
          console.log("Token usage:", { ...usage, ...summary, modelId: modelIdString });
        } catch (err) {
          console.warn("TokenLens enrichment failed", err);
        }
      },
    });

    // AI SDK v5: Use toUIMessageStreamResponse() directly
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

// DELETE handler removed - stateless app doesn't persist chats
// Clients can clear messages locally
