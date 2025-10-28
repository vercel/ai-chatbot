"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Clock, Edit3 } from "lucide-react";
function simpleDiffWords(oldText: string, newText: string) {
  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);
  const result: Array<{ value: string; added?: boolean; removed?: boolean }> = [];
  
  // Very basic diff - just show if text is different
  if (oldText === newText) {
    result.push({ value: oldText });
  } else {
    result.push({ value: oldText, removed: true });
    result.push({ value: " → " });
    result.push({ value: newText, added: true });
  }
  
  return result;
}
import type { ChatMessage } from "@/lib/types";
import type { MessageVersion } from "@/lib/db/schema";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { 
  getMessageVersionsAction, 
  switchToVersionAction 
} from "@/app/(chat)/actions";
import { toast } from "./toast";

interface MessageVersionSwitcherProps {
  message: ChatMessage;
  onVersionSwitch?: (newContent: any) => void;
}

export function MessageVersionSwitcher({ 
  message, 
  onVersionSwitch 
}: MessageVersionSwitcherProps) {
  const [versions, setVersions] = useState<MessageVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<MessageVersion | null>(null);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Load versions on mount
  useEffect(() => {
    async function loadVersions() {
      if (!message.id) return;

      try {
        const messageVersions = await getMessageVersionsAction({ 
          messageId: message.id 
        });
        
        if (messageVersions.length > 1) {
          setVersions(messageVersions);
          // Find the latest version (should be the first one due to sorting)
          const latest = messageVersions[0];
          setSelectedVersion(latest);
          setCurrentVersionNumber(latest.versionNumber);
        }
      } catch (error) {
        console.error("Failed to load versions:", error);
      }
    }

    loadVersions();
  }, [message.id]);

  // Don't render if there's only one version or no versions
  if (versions.length <= 1) {
    return null;
  }

  const handleVersionSelect = async (versionNumber: number) => {
    if (versionNumber === currentVersionNumber) return;

    setIsLoading(true);
    try {
      const result = await switchToVersionAction({
        messageId: message.id,
        versionNumber,
      });

      if (result.success && result.version) {
        setSelectedVersion(result.version);
        setCurrentVersionNumber(versionNumber);
        
        // Notify parent component about the version switch
        if (onVersionSwitch) {
          onVersionSwitch(result.version.content);
        }

        toast({
          type: "success",
          description: `Switched to version ${versionNumber}`,
        });
      } else {
        toast({
          type: "error",
          description: result.message || "Failed to switch version",
        });
      }
    } catch (error) {
      console.error("Failed to switch version:", error);
      toast({
        type: "error",
        description: "Failed to switch version",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDiff = () => {
    if (!selectedVersion || !versions.length) return null;

    // Compare current selected version with the latest version
    const latestVersion = versions[0];
    if (selectedVersion.versionNumber === latestVersion.versionNumber) {
      return (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
          This is the latest version.
        </div>
      );
    }

    const oldText = getPlainTextFromContent(latestVersion.content);
    const newText = getPlainTextFromContent(selectedVersion.content);
    const diffs = simpleDiffWords(oldText || "", newText || "");

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
        <div className="font-medium text-gray-700 mb-1">
          Changes from latest version:
        </div>
        <div className="whitespace-pre-wrap">
          {diffs.map((part: any, i: number) => (
            <span
              key={`diff-${selectedVersion?.versionNumber || 'unknown'}-${i}`}
              className={
                part.added
                  ? "bg-green-100 text-green-800"
                  : part.removed
                  ? "bg-red-100 text-red-800 line-through"
                  : ""
              }
            >
              {part.value}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Version Badge */}
      <Badge variant="secondary" className="text-xs">
        <Edit3 className="w-3 h-3 mr-1" />
        Edited
      </Badge>

      {/* Version Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            disabled={isLoading}
          >
            v{currentVersionNumber}
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.versionNumber}
              onClick={() => handleVersionSelect(version.versionNumber)}
              className="flex items-start gap-2 p-3"
            >
              <div className="flex-shrink-0">
                <div className={`w-2 h-2 rounded-full mt-1 ${
                  version.versionNumber === currentVersionNumber 
                    ? "bg-blue-500" 
                    : "bg-gray-300"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    Version {version.versionNumber}
                  </span>
                  {version.versionNumber === versions[0].versionNumber && (
                    <Badge variant="default" className="text-xs">Latest</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(version.createdAt).toLocaleString()}
                </div>
                {version.editReason && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {version.editReason}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diff Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setShowDiff(!showDiff)}
      >
        {showDiff ? "Hide diff" : "Show diff"}
      </Button>

      {/* Render diff if enabled */}
      {showDiff && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1">
          {renderDiff()}
        </div>
      )}
    </div>
  );
}

/**
 * Extract plain text from message content for diffing
 */
function getPlainTextFromContent(content: any): string {
  if (!content) return "";
  
  if (Array.isArray(content)) {
    return content
      .filter(part => part.type === "text")
      .map(part => part.text || "")
      .join(" ")
      .trim();
  }
  
  if (typeof content === "string") {
    return content;
  }
  
  return "";
}
