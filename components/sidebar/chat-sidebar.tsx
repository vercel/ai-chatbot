"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { ChatSidebarContent } from "@/components/sidebar/chat-sidebar-content";
import { DataStreamHandler } from "@/components/shared/data-stream-handler";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { PlusIcon, CrossIcon, ClockRewind } from "@/components/shared/icons";
import { SidebarHistory } from "./sidebar-history";
import type { VisibilityType } from "@/components/shared/visibility-selector";
import type { ChatHistory } from "./sidebar-history";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatSidebar({
  chatId: initialChatId,
  initialChatModel,
  initialMessages,
  initialVisibilityType,
  isReadonly,
  user,
  onMessagesChange,
  initialHistory,
}: {
  chatId: string;
  initialChatModel: string;
  initialMessages: ChatMessage[];
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  user: User;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  initialHistory?: ChatHistory | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSidebar } = useSidebar();

  const chatIdFromUrl = searchParams.get("chatId");
  const chatId = chatIdFromUrl || initialChatId;
  const [hasMessages, setHasMessages] = useState(initialMessages.length > 0);

  const handleNewChat = () => {
    const newChatId = generateUUID();
    const params = new URLSearchParams(searchParams.toString());
    params.set("chatId", newChatId);
    router.replace(`?${params.toString()}`, { scroll: false });
    setHasMessages(false);
  };

  const handleMessagesChange = (messages: ChatMessage[]) => {
    setHasMessages(messages.length > 0);
    onMessagesChange?.(messages);
  };

  return (
    <>
      <Sidebar variant="inset" side="right" className="md:order-last [&_[data-slot=sidebar-container]]:!p-0 [&_[data-sidebar=sidebar]]:!bg-transparent">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between gap-2 px-2 py-1">
              <div className="flex flex-row items-center gap-1">
                {hasMessages && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-8 p-1 md:h-fit md:p-2"
                        onClick={handleNewChat}
                        type="button"
                        variant="ghost"
                      >
                        <PlusIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      New Chat
                    </TooltipContent>
                  </Tooltip>
                )}
                <DropdownMenu>
                  <Tooltip delayDuration={500}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="h-8 p-1 opacity-50 hover:opacity-100 md:h-fit md:p-2"
                          type="button"
                          variant="ghost"
                        >
                          <ClockRewind />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      Chat History
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto p-0">
                    <div className="p-2">
                      <SidebarHistory user={user} initialHistory={initialHistory} />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8 p-1 opacity-50 hover:opacity-100 md:h-fit md:p-2"
                    onClick={toggleSidebar}
                    type="button"
                    variant="ghost"
                  >
                    <CrossIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end" className="hidden md:block">
                  Close Sidebar
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex flex-col overflow-hidden">
          <ChatSidebarContent
            autoResume={!!chatIdFromUrl}
            chatId={chatId}
            initialChatModel={initialChatModel}
            initialMessages={initialMessages}
            initialVisibilityType={initialVisibilityType}
            isReadonly={isReadonly}
            onMessagesChange={handleMessagesChange}
          />
        </SidebarContent>
      </Sidebar>
      <DataStreamHandler />
    </>
  );
}

