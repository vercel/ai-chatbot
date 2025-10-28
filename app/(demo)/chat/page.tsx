"use client";

import { useEffect, useState } from "react";
import { FullScreenOrb } from "@/components/avatar/FullScreenOrb";
import ContextDrawer from "@/components/ContextDrawer";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatModeToggle } from "@/components/chat/ChatModeToggle";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";
import { useSession } from "@/lib/contexts/SessionContext";
import { mockConversations } from "@/lib/mockConversations";
import { INITIAL_MESSAGES } from "@/lib/mockData";

export default function ChatPage() {
  const [avatarState, setAvatarState] = useState<
    "idle" | "listening" | "thinking" | "speaking"
  >("idle");
  const [avatarText, setAvatarText] = useState<string | undefined>();
  const [chatMode, setChatMode] = useState<"text" | "voice">("text");
  const [key, setKey] = useState(0);
  const { currentSessionId } = useSession();
  const { videoRef, isConnected } = useHeyGenAvatar();

  // Load conversation for current session
  const initialMessages =
    mockConversations[currentSessionId] || INITIAL_MESSAGES;

  // Force remount when session changes - using currentSessionId as trigger
  useEffect(() => {
    setKey(currentSessionId.length); // Use session ID to create unique key
  }, [currentSessionId]);

  return (
    <div className="flex h-full flex-col">
      {/* Header with mode toggle and context */}
      <div className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div className="flex-1">
          <ChatModeToggle mode={chatMode} onModeChange={setChatMode} />
        </div>
        <h1 className="font-semibold text-2xl">Message Glen AI</h1>
        <div className="flex flex-1 items-center justify-end">
          <ContextDrawer />
        </div>
      </div>

      {/* Voice mode: Show orb above chat */}
      {chatMode === "voice" && (
        <div className="flex flex-col items-center justify-center gap-4 border-b bg-gradient-to-b from-background to-muted/20 px-4 py-8">
          <FullScreenOrb
            isConnected={isConnected}
            showAvatar={true}
            size={280}
            state={avatarState}
            text={avatarText}
            videoRef={videoRef}
          />
        </div>
      )}

      {/* Chat container - full height with fixed input */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          enableVoiceDemo={chatMode === "voice"}
          initialMessages={initialMessages}
          key={key}
          onAvatarStateChange={setAvatarState}
          onAvatarTextChange={setAvatarText}
        />
      </div>
    </div>
  );
}
