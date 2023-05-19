import { OpenAIStream, openai } from "@/lib/openai";
import { getServerSession } from "@/lib/session/get-server-session";

export const runtime = "edge";

export async function POST(req: Request) {
  const json = await req.json();
  const session = await getServerSession();

  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: json.messages,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 1,
    max_tokens: 500,
    n: 1,
    stream: true,
  });

  const stream = await OpenAIStream(res);

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}
