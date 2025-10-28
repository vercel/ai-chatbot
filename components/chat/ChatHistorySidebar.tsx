"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Phone,
  Plus,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatSession = {
  id: string;
  title: string;
  type: "text" | "voice" | "avatar";
  timestamp: Date;
  preview?: string;
};

// Mock data organized by time periods
const mockSessions: ChatSession[] = [
  {
    id: "1",
    title: "Healthcare Strategy Discussion",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    preview: "What's your perspective on value-based care?",
  },
  {
    id: "2",
    title: "Leadership Insights",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    preview: "How do you build high-performing teams?",
  },
  {
    id: "3",
    title: "Digital Health Innovation",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    preview: "The future of patient engagement...",
  },
  {
    id: "4",
    title: "Patient Experience Focus",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    preview: "Improving healthcare accessibility...",
  },
  {
    id: "5",
    title: "Tech Stack Discussion",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    preview: "Building scalable health platforms...",
  },
];

const typeIcons = {
  text: MessageSquare,
  voice: Phone,
  avatar: Video,
};

type ChatHistorySidebarProps = {
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewChat?: () => void;
};

export function ChatHistorySidebar({
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: ChatHistorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [sessions] = useState<ChatSession[]>(mockSessions);

  // Group sessions by time period
  const groupSessions = () => {
    const now = new Date();
    const todayList: ChatSession[] = [];
    const yesterdayList: ChatSession[] = [];
    const lastWeekList: ChatSession[] = [];
    const olderList: ChatSession[] = [];

    for (const session of sessions) {
      const diffMs = now.getTime() - session.timestamp.getTime();
      const diffDays = Math.floor(diffMs / 86_400_000);

      if (diffDays === 0) {
        todayList.push(session);
      } else if (diffDays === 1) {
        yesterdayList.push(session);
      } else if (diffDays <= 7) {
        lastWeekList.push(session);
      } else {
        olderList.push(session);
      }
    }

    return {
      today: todayList,
      yesterday: yesterdayList,
      lastWeek: lastWeekList,
      older: olderList,
    };
  };

  const { today, yesterday, lastWeek, older } = groupSessions();

  const renderSession = (session: ChatSession) => {
    const Icon = typeIcons[session.type];
    const isActive = session.id === currentSessionId;
    // Only sessions 1, 2, and 3 have conversations available
    const isAvailable = ["1", "2", "3"].includes(session.id);

    // Color schemes for each chat type
    const typeStyles = {
      text: {
        container: isActive
          ? "bg-blue-500/20 ring-1 ring-blue-500/50"
          : "bg-blue-500/10",
        icon: "text-blue-600 dark:text-blue-400",
      },
      voice: {
        container: isActive
          ? "bg-purple-500/20 ring-1 ring-purple-500/50"
          : "bg-purple-500/10",
        icon: "text-purple-600 dark:text-purple-400",
      },
      avatar: {
        container: isActive
          ? "bg-teal-500/20 ring-1 ring-teal-500/50"
          : "bg-teal-500/10",
        icon: "text-teal-600 dark:text-teal-400",
      },
    };

    const currentStyle = typeStyles[session.type];

    return (
      <button
        className={cn(
          "group relative mb-1 w-full rounded-lg p-2.5 text-left transition-colors",
          isAvailable
            ? "cursor-pointer hover:bg-accent"
            : "cursor-not-allowed opacity-40",
          isActive && "bg-accent",
          collapsed && "flex items-center justify-center"
        )}
        disabled={!isAvailable}
        key={session.id}
        onClick={() => isAvailable && onSessionSelect?.(session.id)}
        title={collapsed ? session.title : undefined}
        type="button"
      >
        {collapsed ? (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
              currentStyle.container
            )}
          >
            <Icon className={cn("h-4 w-4", currentStyle.icon)} />
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
                currentStyle.container
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", currentStyle.icon)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 font-medium text-sm">
                {session.title}
              </div>
              {!isAvailable && (
                <div className="text-muted-foreground text-xs">Coming soon</div>
              )}
            </div>
          </div>
        )}
      </button>
    );
  };

  const renderSection = (title: string, sessionList: ChatSession[]) => {
    if (sessionList.length === 0 || collapsed) {
      return null;
    }

    return (
      <div className="mb-4">
        <h3 className="mb-1 px-2.5 font-semibold text-muted-foreground text-xs">
          {title}
        </h3>
        <div>{sessionList.map(renderSession)}</div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between border-b p-3">
        {!collapsed && <h2 className="font-semibold text-sm">Glen AI</h2>}
        <Button
          className={cn("h-8 w-8 shrink-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
          size="icon"
          variant="ghost"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          className={cn(
            "w-full justify-start gap-2",
            collapsed && "justify-center px-2"
          )}
          onClick={onNewChat}
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Sessions List with Sections */}
      <div className="flex-1 overflow-y-auto px-2">
        {collapsed ? (
          <div className="space-y-1">{sessions.map(renderSession)}</div>
        ) : (
          <>
            {renderSection("Today", today)}
            {renderSection("Yesterday", yesterday)}
            {renderSection("Last 7 Days", lastWeek)}
            {renderSection("Older", older)}
          </>
        )}
      </div>
    </div>
  );
}
