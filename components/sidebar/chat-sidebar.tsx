"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "next-auth";
import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
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
import type { ChatMessage, Attachment } from "@/lib/types";
import { generateUUID, cn } from "@/lib/utils";
import { PlusIcon, ClockRewind, CrossIcon } from "@/components/shared/icons";
import { Maximize2, Minimize2, FileXCorner } from "lucide-react";
import { SidebarHistory } from "./sidebar-history";
import type { VisibilityType } from "@/components/shared/visibility-selector";
import type { ChatHistory } from "./sidebar-history";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArtifactSelector, useArtifact, initialArtifactData } from "@/hooks/use-artifact";
import { Artifact } from "@/components/artifact/artifact";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@/lib/db/schema";

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
  const { toggleSidebar, open } = useSidebar();
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();
  const [isExpandedMode, setIsExpandedMode] = useState(false);

  // Load expanded mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-expanded-mode");
    if (stored === "true") {
      setIsExpandedMode(true);
      // Dispatch event to sync with SidebarWidthManager
      window.dispatchEvent(
        new CustomEvent("sidebar-expanded-toggle", { detail: true })
      );
    }
  }, []);

  const handleExpandedToggle = () => {
    const newMode = !isExpandedMode;
    setIsExpandedMode(newMode);
    localStorage.setItem("sidebar-expanded-mode", newMode ? "true" : "false");
    
    // Dispatch custom event to notify SidebarWidthManager
    window.dispatchEvent(
      new CustomEvent("sidebar-expanded-toggle", { detail: newMode })
    );
  };

  const handleCloseClick = () => {
    if (isArtifactVisible) {
      // Close artifact when artifact is visible
      setArtifact((currentArtifact) =>
        currentArtifact.status === "streaming"
          ? {
              ...currentArtifact,
              isVisible: false,
            }
          : { ...initialArtifactData, status: "idle" }
      );
    } else {
      // Close chat sidebar when no artifact
      toggleSidebar();
    }
  };

  // Reset expanded mode when sidebar is closed
  useEffect(() => {
    if (!open && isExpandedMode) {
      setIsExpandedMode(false);
      localStorage.setItem("sidebar-expanded-mode", "false");
      // Dispatch event to notify SidebarWidthManager
      window.dispatchEvent(
        new CustomEvent("sidebar-expanded-toggle", { detail: false })
      );
    }
  }, [open, isExpandedMode]);

  const chatIdFromUrl = searchParams.get("chatId");
  const chatId = chatIdFromUrl || initialChatId;
  const [hasMessages, setHasMessages] = useState(initialMessages.length > 0);
  const [artifactProps, setArtifactProps] = useState<{
    attachments: Attachment[];
    chatId: string;
    input: string;
    isReadonly: boolean;
    messages: ChatMessage[];
    regenerate: UseChatHelpers<ChatMessage>["regenerate"];
    selectedModelId: string;
    selectedVisibilityType: VisibilityType;
    sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
    setAttachments: Dispatch<SetStateAction<Attachment[]>>;
    setInput: Dispatch<SetStateAction<string>>;
    setMessages: UseChatHelpers<ChatMessage>["setMessages"];
    status: UseChatHelpers<ChatMessage>["status"];
    stop: UseChatHelpers<ChatMessage>["stop"];
    votes: Vote[] | undefined;
  } | null>(null);

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

  useEffect(() => {
    if (!isArtifactVisible) {
      setArtifactProps(null);
    }
  }, [isArtifactVisible]);

  // Clear artifact props when chatId changes
  useEffect(() => {
    setArtifactProps(null);
  }, [chatId]);

  return (
    <>
      <Sidebar variant="inset" side="right" className="md:order-last **:data-[slot=sidebar-container]:p-0! **:data-[sidebar=sidebar]:bg-transparent!">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between gap-2 p-1">
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
              <div className="flex flex-row items-center gap-1">
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <Button
                      className={cn(
                        "h-8 p-1 opacity-50 hover:opacity-100 md:h-fit md:p-2",
                        isExpandedMode && "opacity-100 bg-accent"
                      )}
                      onClick={handleExpandedToggle}
                      type="button"
                      variant="ghost"
                    >
                      {isExpandedMode ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    {isExpandedMode ? "Exit Expanded" : "Expand Chat"}
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 opacity-50 hover:opacity-100 md:h-fit md:p-2"
                      onClick={handleCloseClick}
                      type="button"
                      variant="ghost"
                    >
                      {isArtifactVisible ? (
                        <FileXCorner className="h-4 w-4" />
                      ) : (
                        <CrossIcon />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    {isArtifactVisible ? "Close Artifact" : "Close Sidebar"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex flex-col overflow-hidden">
          <div className={isArtifactVisible ? "flex h-full flex-row overflow-hidden" : "flex h-full flex-col overflow-hidden"}>
            <div className={isArtifactVisible ? "flex min-w-0 flex-1 flex-col overflow-hidden border-r border-border" : "flex h-full flex-1 flex-col overflow-hidden"}>
              <ChatSidebarContent
                key={chatId}
                autoResume={!!chatIdFromUrl}
                chatId={chatId}
                initialChatModel={initialChatModel}
                initialMessages={initialMessages}
                initialVisibilityType={initialVisibilityType}
                isReadonly={isReadonly}
                onMessagesChange={handleMessagesChange}
                onArtifactPropsReady={setArtifactProps}
              />
            </div>
            {isArtifactVisible && artifactProps && (
              <div className="flex min-w-0 flex-[2] flex-col overflow-hidden">
                <Artifact {...artifactProps} variant="sidebar" />
              </div>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
      <DataStreamHandler />
    </>
  );
}

