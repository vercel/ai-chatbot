"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import type { DBMessage } from "@/lib/db/schema";
import { getMessageVersionsAction, switchToVersionAction } from "@/app/(chat)/actions";
import { Action } from "./elements/actions";

interface MessageVersionSwitcherProps {
  message: ChatMessage;
  onVersionSwitch?: (newContent: any) => void;
  onAssistantSwitch?: (assistant: any | null) => void;
  onRegenerateAfterSwitch?: () => void;
}

export function MessageVersionSwitcher({
  message,
  onVersionSwitch,
  onAssistantSwitch,
  onRegenerateAfterSwitch,
}: MessageVersionSwitcherProps) {
  const [versions, setVersions] = useState<DBMessage[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  const total = versions.length;
  const maxVersionNumber = useMemo(
    () => (versions.length ? Math.max(...versions.map((v) => v.versionNumber || 1)) : 1),
    [versions]
  );
  const hasPrev = useMemo(() => total > 1 && currentVersionNumber > 1, [total, currentVersionNumber]);
  const hasNext = useMemo(
    () => total > 1 && currentVersionNumber < maxVersionNumber,
    [total, currentVersionNumber, maxVersionNumber]
  );

  useEffect(() => {
    let ignore = false;
    async function loadVersions() {
      if (!message.id) return;
      try {
        const messageVersions = await getMessageVersionsAction({ messageId: message.id });
        if (ignore) return;
        setVersions(messageVersions);
        if (messageVersions.length > 0) {
          const current = messageVersions.find((v) => v.isCurrentVersion) || messageVersions[0];
          setCurrentVersionNumber(current.versionNumber || 1);
        }
      } catch (error) {
        console.error("Failed to load versions:", error);
      }
    }
    loadVersions();
    return () => {
      ignore = true;
    };
  }, [message.id]);

  if (versions.length <= 1) return null;

  const handleVersionSelect = async (versionNumber: number) => {
    if (versionNumber === currentVersionNumber) return;
    setIsLoading(true);
    try {
      const result = await switchToVersionAction({ messageId: message.id, versionNumber });
      if (result.success && result.version) {
        setCurrentVersionNumber(versionNumber);
        onVersionSwitch?.(
          result.version.parts || result.version.latestContent || result.version.content
        );
        onAssistantSwitch?.(result.assistant || null);
      } else {
        console.error("Failed to switch version:", result.message);
      }
    } catch (error) {
      console.error("Failed to switch version:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="flex items-center gap-0.5 overflow-visible">
      <Action
        variant="ghost"
        size="sm"
        className="p-0 h-7 w-6 rounded-sm"
        tooltip="Previous version"
        disabled={!hasPrev || isLoading}
        onClick={() => handleVersionSelect((currentVersionNumber || 1) - 1)}
      >
        <ChevronLeft className="h-3 w-3" />
      </Action>
      <span className="text-xs tabular-nums h-7 leading-none flex items-center px-0">
        {currentVersionNumber}/{total}
      </span>
      <Action
        variant="ghost"
        size="sm"
        className="p-0 h-7 w-6 rounded-sm"
        tooltip="Next version"
        disabled={!hasNext || isLoading}
        onClick={() => handleVersionSelect((currentVersionNumber || 1) + 1)}
      >
        <ChevronRight className="h-3 w-3" />
      </Action>
    </div>
  );
}

