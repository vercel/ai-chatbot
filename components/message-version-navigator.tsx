"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatMessage } from "@/lib/types";
import type { DBMessage } from "@/lib/db/schema";
import { Button } from "./ui/button";
import { getMessageVersionsAction, switchMessageVersionAction } from "@/app/(chat)/actions";
import { toast } from "./toast";

interface MessageVersionNavigatorProps {
  message: ChatMessage;
  chatId: string;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
}

export function MessageVersionNavigator({
  message,
  chatId,
  setMessages,
  regenerate,
}: MessageVersionNavigatorProps) {
  const [versions, setVersions] = useState<DBMessage[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMultipleVersions, setHasMultipleVersions] = useState(false);

  useEffect(() => {
    async function loadVersions() {
      setIsLoading(true);
      
      try {
        // First, try using the message ID directly as the version group ID
        console.log("Checking versions for message ID:", message.id);
        let messageVersions = await getMessageVersionsAction({ versionGroupId: message.id });
        
        // If no versions found with message ID, it might be that this message is part of a version group
        // where the version group ID is different from the current message ID
        if (!messageVersions || messageVersions.length <= 1) {
          console.log("No versions found with message ID, checking if message has version info...");
          // For now, let's assume there are no versions if we can't find them
          // In a future improvement, we could check the database for any version group that contains this message
        }
        
        if (messageVersions && messageVersions.length > 1) {
          console.log("Found", messageVersions.length, "versions for message:", message.id);
          setVersions(messageVersions);
          setHasMultipleVersions(true);
          
          // Find current version index
          const currentIndex = messageVersions.findIndex(v => v.isCurrentVersion);
          const foundIndex = currentIndex >= 0 ? currentIndex : 0;
          console.log("Current version index:", foundIndex);
          setCurrentVersionIndex(foundIndex);
        } else {
          console.log("Only one or no versions found, not showing navigator");
          setHasMultipleVersions(false);
        }
      } catch (error) {
        console.error("Failed to load versions:", error);
        setHasMultipleVersions(false);
      }
      
      setIsLoading(false);
    }

    loadVersions();
  }, [message.id]);

  const switchToVersion = async (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= versions.length || isLoading) return;

    try {
      const targetVersion = versions[targetIndex];
      const versionGroupId = targetVersion.versionGroupId || targetVersion.id;
      
      // Switch version in database
      await switchMessageVersionAction({
        versionGroupId,
        targetVersionNumber: targetVersion.versionNumber!,
        chatId,
      });

      // Update local state
      setCurrentVersionIndex(targetIndex);

      // Update messages in the chat
      setMessages((messages) => {
        const messageIndex = messages.findIndex((m) => m.id === message.id);
        if (messageIndex !== -1) {
          const updatedMessage: ChatMessage = {
            ...message,
            parts: targetVersion.parts,
          };

          // Remove all messages after this one (AI responses will be regenerated)
          const newMessages = messages.slice(0, messageIndex + 1);
          newMessages[messageIndex] = updatedMessage;
          return newMessages;
        }
        return messages;
      });

      // Regenerate AI response
      regenerate();

      toast({
        type: "success",
        description: `Switched to version ${targetVersion.versionNumber}`,
      });
    } catch (error) {
      console.error("Failed to switch version:", error);
      toast({
        type: "error",
        description: "Failed to switch message version",
      });
    }
  };

  // Don't show navigator if there's only one version or no versions, or if still loading
  if (!hasMultipleVersions || versions.length <= 1) {
    return null;
  }

  const currentVersion = currentVersionIndex + 1;
  const totalVersions = versions.length;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => switchToVersion(currentVersionIndex - 1)}
        disabled={currentVersionIndex === 0 || isLoading}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
      
      <span className="min-w-[2rem] text-center">
        {isLoading ? "..." : `${currentVersion}/${totalVersions}`}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => switchToVersion(currentVersionIndex + 1)}
        disabled={currentVersionIndex === versions.length - 1 || isLoading}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
