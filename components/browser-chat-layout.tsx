"use client";

import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import type { VisibilityType } from "@/components/visibility-selector";
import { BrowserChat } from "./browser-chat";
import { BrowserViewport } from "./browser-viewport";

export function BrowserChatLayout(props: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const {
    id,
    initialMessages,
    initialChatModel,
    initialVisibilityType,
    isReadonly,
    autoResume,
    initialLastContext,
  } = props;

  return (
    <div className="flex h-dvh min-w-0 flex-row gap-4 bg-background p-2 md:p-4">
      {/* Left: Browser viewport */}
      <div className="flex w-1/2 flex-col overflow-hidden rounded-lg border bg-background">
        <BrowserViewport />
      </div>

      {/* Right: Chat UI reusing existing components */}
      <div className="flex w-1/2 flex-col overflow-hidden rounded-lg border bg-background">
        <BrowserChat
          autoResume={autoResume}
          id={id}
          initialChatModel={initialChatModel}
          initialLastContext={initialLastContext}
          initialMessages={initialMessages}
          initialVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
        />
      </div>
    </div>
  );
}
