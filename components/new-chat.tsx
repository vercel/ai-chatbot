"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Chat } from "@/components/chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export function NewChat() {
  const pathname = usePathname();
  const [resetKey, setResetKey] = useState(0);

  // Increment key when navigating back to / to force Chat remount
  useEffect(() => {
    if (pathname === "/") {
      setResetKey((k) => k + 1);
    }
  }, [pathname]);

  return (
    <Chat
      autoResume={false}
      initialChatModel={DEFAULT_CHAT_MODEL}
      initialMessages={[]}
      initialVisibilityType="private"
      isReadonly={false}
      key={resetKey}
    />
  );
}
