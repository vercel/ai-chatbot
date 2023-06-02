import { auth } from "@/auth";
import { OpenAIStream, StreamingTextResponse } from "ai-connector";
import { openai } from "@/lib/openai";

export const POST = auth(async function POST(req: Request) {
  const json = await req.json();
  // @ts-ignore
  console.log(req.auth); // todo fix types

  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: json.messages.map((m) => ({ content: m.content, role: m.role })),
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 1,
    max_tokens: 500,
    n: 1,
    stream: true,
  });

  const stream = OpenAIStream(res);
  return new StreamingTextResponse(stream);
});
