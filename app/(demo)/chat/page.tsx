"use client";

import { useState, useEffect } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatModeToggle } from "@/components/chat/ChatModeToggle";
import { AvatarDock } from "@/components/avatar";
import ContextDrawer from "@/components/ContextDrawer";
import { ABOUT_TEXT, INITIAL_MESSAGES } from "@/lib/mockData";
import { useSession } from "@/lib/contexts/SessionContext";
import { mockConversations } from "@/lib/mockConversations";

export default function ChatPage() {
  const [avatarState, setAvatarState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [avatarText, setAvatarText] = useState<string | undefined>();
  const [chatMode, setChatMode] = useState<"text" | "voice">("text");
  const [key, setKey] = useState(0);
  const { currentSessionId } = useSession();

  // Load conversation for current session
  const initialMessages = mockConversations[currentSessionId] || INITIAL_MESSAGES;

  // Force remount when session changes
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [currentSessionId]);

  return (
    <div className="flex h-full flex-col">
      {/* Header with mode toggle and context */}
      <div className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <ChatModeToggle mode={chatMode} onModeChange={setChatMode} />
        <h1 className="font-semibold text-xl">Message Glen AI</h1>
        <ContextDrawer about={ABOUT_TEXT} />
      </div>

      {/* Chat container - full height with fixed input */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          key={key}
          initialMessages={initialMessages}
          enableVoiceDemo={chatMode === "voice"}
          onAvatarStateChange={setAvatarState}
          onAvatarTextChange={setAvatarText}
        />
      </div>

      {/* Avatar Dock for voice demo - only show in voice mode */}
      {chatMode === "voice" && (
        <AvatarDock state={avatarState} text={avatarText} />
      )}
    </div>
  );
}
