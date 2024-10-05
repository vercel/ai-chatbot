import { customModel } from "@/ai";
import { saveChat } from "@/app/(chat)/actions";
import { convertToCoreMessages, streamText } from "ai";
import { getUserFromSession } from "@/app/(auth)/actions";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const { id, messages, selectedFilePathnames } = await request.json();

  const user = await getUserFromSession();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await streamText({
    model: customModel,
    system:
      "you are a friendly assistant! keep your responses concise and helpful.",
    messages: convertToCoreMessages(messages),
    experimental_providerMetadata: {
      files: {
        selection: selectedFilePathnames,
      },
    },
    onFinish: async ({ text }) => {
      await saveChat({
        id,
        messages: [...messages, { role: "assistant", content: text }],
        userId: user.id,
      });
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.from("chat").delete().eq("id", id);

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
