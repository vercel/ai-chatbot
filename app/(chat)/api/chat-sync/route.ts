import { NextRequest } from "next/server";
import { z } from "zod";
import { langchainService } from "@/lib/langchain/service";
import { customModel } from "@/lib/ai";
import { models } from "@/lib/ai/models";
import { AISDKExporter } from "langsmith/vercel";
import { systemPrompt } from "@/lib/ai/prompts";
import { traceable } from "langsmith/traceable";
import { generateText } from "ai";

const requestSchema = z.object({
  userId: z.string(),
  message: z.string(),
  modelId: z.string().optional().default("gpt-4-turbo-preview"),
});

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.API_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, message, modelId } = requestSchema.parse(body);

    const model = models.find((m) => m.id === modelId);
    if (!model) {
      return Response.json({ error: "Model not found" }, { status: 404 });
    }

    const chatOperation = traceable(
      async () => {
        await langchainService.initialize(userId);

        const { text } = await generateText({
          model: customModel(model.apiIdentifier),
          system: systemPrompt,
          messages: [{ role: "user", content: message }],
          maxSteps: 5,
          experimental_activeTools: ["searchKnowledgeBase"],
          experimental_telemetry: AISDKExporter.getSettings({}),
          tools: {
            searchKnowledgeBase: {
              description:
                "REQUIRED: You MUST use this tool FIRST for EVERY question, no exceptions.",
              parameters: z.object({
                query: z.string().describe("the exact question from the user"),
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
        });

        return text;
      },
      {
        name: `chat-sync`,
        inputs: {
          message,
        },
        metadata: {
          userId,
          model: model.apiIdentifier,
        },
      }
    );

    const result = await chatOperation();
    return Response.json({ text: result });
  } catch (error) {
    console.error("Error in chat sync:", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
