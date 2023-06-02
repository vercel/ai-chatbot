import { auth } from "@/auth";
import { chats, db } from "@/lib/db/schema";
import { OpenAIStream, StreamingTextResponse } from "ai-connector";
import { Configuration, OpenAIApi } from "openai-edge";

export const runtime = "edge";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const POST = auth(async function POST(req: Request) {
  const json = await req.json();
  // @ts-ignore
  console.log(req.auth); // todo fix types
  const messages = json.messages.map((m: any) => ({
    content: m.content,
    role: m.role,
  }));
  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 1,
    max_tokens: 500,
    n: 1,
    stream: true,
  });

  const stream = await OpenAIStream(res, {
    async onCompletion(completion) {
      // @ts-ignore
      if (req.auth?.user?.email == null) {
        return;
      }
      const title = json.messages[0].content.substring(0, 20);
      const payload = {
        id: crypto.randomUUID(),
        title,
        userId: (req as any).auth?.user?.email,
        messages: [
          ...messages,
          {
            content: completion,
            role: "assistant",
          },
        ],
      };
      const chat = await db
        .insert(chats)
        .values(payload)
        // .onConflictDoUpdate({
        //   target: payload.id,
        //   set: payload,
        // })
        .returning();
      console.log(chat);
    },
  });

  return new StreamingTextResponse(stream);
});
