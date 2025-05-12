import { cookies } from "next/headers";

import { PrivateCodeChat } from "@/components/chat";
import type { Metadata } from "next";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://chatbot-in.vercel.app/rephrase-text-professionally",
  ),
  title: "Rephrase Text Professionally",
};

const chatId = "rephrase-text-professionally";
const title = "Rephrase Text Professionally";
const SYSTEM_PROMPT = `
You are an expert communication assistant. For every text:
Rephrase the text, correct the grammatic errors to make it more professional.
`;
export default async function PrivateCodeChatPage() {
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");
  if (!chatModelFromCookie) {
    return (
      <PrivateCodeChat
        id={chatId}
        selectedChatModel={DEFAULT_CHAT_MODEL}
        systemPrompt={SYSTEM_PROMPT}
      />
    );
  } else {
    return (
      <PrivateCodeChat
        id={chatId}
        selectedChatModel={chatModelFromCookie?.value}
        systemPrompt={SYSTEM_PROMPT}
      />
    );
  }
}
