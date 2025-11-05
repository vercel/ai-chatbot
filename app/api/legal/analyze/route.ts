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

    // Legal document analysis prompt
    const systemPrompt = `You are a legal AI assistant specializing in document analysis. 
    
    When analyzing legal documents, provide:
    1. Document type classification
    2. Executive summary
    3. Key terms and provisions
    4. Potential legal risks
    5. Recommendations for review
    
    Be thorough but concise. Focus on practical legal implications.
    Always recommend consulting with a qualified attorney for final decisions.`;

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
    console.error("Legal analysis error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}