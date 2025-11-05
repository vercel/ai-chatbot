import { auth } from "@/app/(auth)/auth";
import { openai } from "ai";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Legal research prompt
    const systemPrompt = `You are a legal research AI assistant with access to case law, statutes, and legal precedents.

    When conducting legal research, provide:
    1. Relevant case law with citations
    2. Applicable statutes and regulations
    3. Legal precedents and trends
    4. Jurisdictional considerations
    5. Practical implications

    Format your response with:
    - Clear citations in proper legal format
    - Brief case summaries with key holdings
    - Statute text excerpts when relevant
    - Analysis of how the law applies to the query

    Always note jurisdictional limitations and recommend verifying current law.
    Suggest consulting with local counsel for jurisdiction-specific advice.`;

    const result = await streamText({
      model: openai("gpt-4-turbo-preview"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: lastMessage.content,
        },
      ],
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error("Legal research error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}