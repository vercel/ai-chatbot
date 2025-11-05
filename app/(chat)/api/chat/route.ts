import { google } from "@ai-sdk/google";
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
import { getIndonesianNewsFeeds } from "@/lib/ai/tools/get-indonesian-news-feeds";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { searchIndonesianNews } from "@/lib/ai/tools/search-indonesian-news";
import { isProductionEnvironment } from "@/lib/constants";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";

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
    const {
      messages,
      selectedChatModel,
      webSearchEnabled,
      newsSearchEnabled,
      languagePreference,
    }: {
      messages: UIMessage[];
      selectedChatModel?: ChatModel["id"];
      webSearchEnabled?: boolean;
      newsSearchEnabled?: boolean;
      languagePreference?: string;
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

    const model = myProvider.languageModel(modelId);

    // Build tools object conditionally
    const tools: Record<string, any> = {
      getWeather,
      requestSuggestions: requestSuggestions({
        session: null,
        dataStream: null,
      }),
    };

    // Add search tools if enabled
    if (webSearchEnabled) {
      tools.google_search = google.tools.googleSearch({});
      tools.url_context = google.tools.urlContext({});
    }

    if (newsSearchEnabled) {
      tools.getIndonesianNewsFeeds = getIndonesianNewsFeeds;
      tools.searchIndonesianNews = searchIndonesianNews;
      // Need google_search to actually perform the search
      if (!tools.google_search) {
        tools.google_search = google.tools.googleSearch({});
      }
      // Also add url_context for news summaries
      if (!tools.url_context) {
        tools.url_context = google.tools.urlContext({});
      }
    }

    // Build activeTools array
    const activeTools =
      modelId === "chat-model-reasoning"
        ? []
        : ["getWeather", "requestSuggestions"];

    if (webSearchEnabled) {
      activeTools.push("google_search", "url_context");
    }

    if (newsSearchEnabled) {
      activeTools.push("getIndonesianNewsFeeds");
      activeTools.push("searchIndonesianNews");
      if (!activeTools.includes("google_search")) {
        activeTools.push("google_search");
      }
      if (!activeTools.includes("url_context")) {
        activeTools.push("url_context");
      }
    }

    // Use AI SDK v5 streamText with toUIMessageStreamResponse
    const result = streamText({
      model,
      system: systemPrompt({
        selectedChatModel: modelId,
        requestHints,
        webSearchEnabled,
        newsSearchEnabled,
        languagePreference,
      }),
      messages: convertToModelMessages(uiMessages),
      stopWhen: stepCountIs(5),
      activeTools,
      experimental_transform: smoothStream({ chunking: "word" }),
      tools,
      experimental_telemetry: {
        isEnabled: isProductionEnvironment,
        functionId: "stream-text",
      },
      onFinish: async ({ usage, response }) => {
        try {
          const providers = await getTokenlensCatalog();
          const modelIdString = myProvider.languageModel(modelId).modelId;
          if (!modelIdString || !providers) {
            return;
          }

          const summary = getUsage({
            modelId: modelIdString,
            usage,
            providers,
          });
          // Usage tracking can be logged but not persisted in stateless app
          console.log("Token usage:", {
            ...usage,
            ...summary,
            modelId: modelIdString,
          });

          // Extract sources from Google Search/Grounding
          if (webSearchEnabled || newsSearchEnabled) {
            // Provider metadata and sources may be available at runtime but not in types
            const responseWithMetadata = response as {
              providerMetadata?: {
                google?: {
                  groundingMetadata?: {
                    groundingChunks?: Array<{
                      web?: {
                        uri?: string | null;
                        title?: string | null;
                      } | null;
                    }>;
                  };
                  urlContextMetadata?: {
                    urlMetadata?: Array<{
                      retrievedUrl?: string;
                    }>;
                  };
                };
              };
              sources?: string[];
            };

            const googleMetadata =
              responseWithMetadata?.providerMetadata?.google;
            const sources: string[] = [];

            // Extract from response.sources if available
            if (responseWithMetadata?.sources) {
              sources.push(...responseWithMetadata.sources);
            }

            // Extract from groundingMetadata
            const groundingMetadata = googleMetadata?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
              for (const chunk of groundingMetadata.groundingChunks) {
                if (chunk.web?.uri && !sources.includes(chunk.web.uri)) {
                  sources.push(chunk.web.uri);
                }
              }
            }

            // Extract from urlContextMetadata
            const urlContextMetadata = googleMetadata?.urlContextMetadata;
            if (urlContextMetadata?.urlMetadata) {
              for (const metadata of urlContextMetadata.urlMetadata) {
                if (
                  metadata.retrievedUrl &&
                  !sources.includes(metadata.retrievedUrl)
                ) {
                  sources.push(metadata.retrievedUrl);
                }
              }
            }

            // Log sources for debugging
            if (sources.length > 0) {
              console.log("Extracted sources:", sources);
              // Note: Sources will be included in the message stream automatically by toUIMessageStreamResponse
              // We'll handle display on the client side by checking message.sources or response.providerMetadata
            }
            console.log("Response:", response);
            console.log("groundingMetadata:", groundingMetadata);
            console.log("urlContextMetadata:", urlContextMetadata);
            console.log("googleMetadata:", googleMetadata);
          }
        } catch (err) {
          console.warn("TokenLens enrichment failed", err);
        }
      },
    });

    // AI SDK v5: Use toUIMessageStreamResponse() directly
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      sendSources: true,
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
