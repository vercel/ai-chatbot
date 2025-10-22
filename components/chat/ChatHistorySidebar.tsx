"use client";

import { useState } from "react";
import { MessageSquare, Phone, Video, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const lastWeek: ChatSession[] = [];
    const older: ChatSession[] = [];

    sessions.forEach((session) => {
      const diffMs = now.getTime() - session.timestamp.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays === 0) today.push(session);
      else if (diffDays === 1) yesterday.push(session);
      else if (diffDays <= 7) lastWeek.push(session);
      else older.push(session);
    });

    return { today, yesterday, lastWeek, older };
  };

  const { today, yesterday, lastWeek, older } = groupSessions();

  const renderSession = (session: ChatSession) => {
    const Icon = typeIcons[session.type];
    const isActive = session.id === currentSessionId;

    return (
      <button
        key={session.id}
        onClick={() => onSessionSelect?.(session.id)}
        className={cn(
          "group relative mb-1 w-full rounded-lg p-2.5 text-left transition-colors",
          "hover:bg-accent",
          isActive && "bg-accent",
          collapsed && "flex items-center justify-center"
        )}
        title={collapsed ? session.title : undefined}
      >
        {collapsed ? (
          <Icon className="h-4 w-4" />
        ) : (
          <div className="flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-medium">
                {session.title}
              </div>
            </div>
          </div>
        )}
      </button>
    );
  };

  const renderSection = (title: string, sessions: ChatSession[]) => {
    if (sessions.length === 0 || collapsed) return null;

    return (
      <div className="mb-4">
        <h3 className="mb-1 px-2.5 text-xs font-semibold text-muted-foreground">
          {title}
        </h3>
        <div>{sessions.map(renderSession)}</div>
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
        {!collapsed && (
          <h2 className="font-semibold text-sm">Glen AI</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8 shrink-0", collapsed && "mx-auto")}
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
          variant="outline"
          className={cn("w-full justify-start gap-2", collapsed && "justify-center px-2")}
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Sessions List with Sections */}
      <div className="flex-1 overflow-y-auto px-2">
        {collapsed ? (
          <div className="space-y-1">
            {sessions.map(renderSession)}
          </div>
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
