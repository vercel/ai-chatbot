"use client";

import {
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  MessageSquare,
  Phone,
  Plus,
  Shield,
  User,
  Users,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ChatSession = {
  id: string;
  title: string;
  type: "text" | "voice" | "avatar";
  timestamp: Date;
};

const mockSessions: ChatSession[] = [
  {
    id: "1",
    title: "Healthcare Philosophy",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    title: "2025 Priorities",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    id: "3",
    title: "Leadership Lessons",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "4",
    title: "Building high-performing teams",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "5",
    title: "Digital Health Innovation",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "6",
    title: "Patient engagement strategies",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: "7",
    title: "Scaling healthcare tech startups",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: "8",
    title: "Patient Experience Focus",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
  {
    id: "9",
    title: "AI in healthcare delivery",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
  },
  {
    id: "10",
    title: "Improving accessibility",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: "11",
    title: "Tech Stack Discussion",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
  },
  {
    id: "12",
    title: "Future of telemedicine",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: "13",
    title: "Regulatory challenges in healthtech",
    type: "text",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: "14",
    title: "Career advice for healthcare leaders",
    type: "voice",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
  {
    id: "15",
    title: "Transcarent's mission and vision",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
  },
];

const typeIcons = {
  text: MessageSquare,
  voice: Phone,
  avatar: Video,
};

const adminNavItems = [
  { href: "/cms", label: "CMS", icon: Database },
  { href: "/users", label: "Users", icon: Users },
  { href: "/twins", label: "Twins", icon: Zap },
];

type UnifiedSidebarProps = {
  isAdmin?: boolean;
  onToggleRole?: () => void;
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewChat?: () => void;
};

export default function UnifiedSidebar({
  isAdmin = true,
  onToggleRole,
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: UnifiedSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [sessions] = useState<ChatSession[]>(mockSessions);
  const pathname = usePathname();
  const router = useRouter();

  const groupSessions = () => {
    const now = new Date();
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const lastWeek: ChatSession[] = [];
    const older: ChatSession[] = [];

    sessions.forEach((session) => {
      const diffMs = now.getTime() - session.timestamp.getTime();
      const diffDays = Math.floor(diffMs / 86_400_000);

      if (diffDays === 0) today.push(session);
      else if (diffDays === 1) yesterday.push(session);
      else if (diffDays <= 7) lastWeek.push(session);
      else older.push(session);
    });

    return { today, yesterday, lastWeek, older };
  };

  const { today, yesterday, lastWeek, older } = groupSessions();

  const handleLogout = () => {
    if (isAdmin) {
      router.push("/");
    } else {
      router.push("/twin/glen-tullman");
    }
  };

  const renderSession = (session: ChatSession) => {
    const Icon = typeIcons[session.type];
    const isActive = session.id === currentSessionId;
    const hasContent = ["1", "2", "3"].includes(session.id);
    const tooltipText = hasContent
      ? session.title
      : `${session.title} (Demo placeholder - no content)`;

    return (
      <button
        className={cn(
          "group relative mb-1 w-full rounded-lg p-2.5 text-left transition-colors",
          "hover:bg-accent",
          isActive && "bg-accent",
          !hasContent && "opacity-60",
          collapsed && "flex items-center justify-center"
        )}
        key={session.id}
        onClick={() => onSessionSelect?.(session.id)}
        title={collapsed ? tooltipText : !hasContent ? tooltipText : undefined}
      >
        {collapsed ? (
          <Icon className="h-4 w-4" />
        ) : (
          <div className="flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm">{session.title}</div>
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
        <h3 className="mb-1 px-2.5 font-medium text-muted-foreground text-xs">
          {title}
        </h3>
        <div>{sessions.map(renderSession)}</div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        {!collapsed && (
          <Link className="font-semibold text-lg hover:opacity-80" href="/">
            Glen AI
          </Link>
        )}
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

      {/* Action Buttons */}
      <div className="space-y-2 px-3 pb-3">
        <Link href="/avatar" className="block">
          <Button
            className={cn(
              "w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
              collapsed && "justify-center px-2"
            )}
            variant="default"
          >
            <Video className="h-4 w-4" />
            {!collapsed && <span>Video Avatar</span>}
          </Button>
        </Link>

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

      {/* Chat History - only show when NOT collapsed */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2">
          {renderSection("Today", today)}
          {renderSection("Yesterday", yesterday)}
          {renderSection("Last 7 Days", lastWeek)}
          {renderSection("Older", older)}
        </div>
      )}

      {/* Spacer when collapsed */}
      {collapsed && <div className="flex-1" />}

      {/* Admin Navigation */}
      {isAdmin && (
        <>
          <Separator className="my-2" />
          {!collapsed && (
            <div className="px-2 pb-2">
              <h3 className="mb-1 px-2.5 font-medium text-muted-foreground text-xs">
                Administration
              </h3>
              <div className="space-y-1">
                {adminNavItems.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname?.startsWith(`${href}/`);
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        "hover:bg-accent",
                        isActive && "bg-accent font-medium"
                      )}
                      href={href}
                      key={href}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Controls */}
      <div className={cn("p-3", isAdmin && "border-t")}>
        <div className="space-y-1">
          {/* Role Toggle */}
          {onToggleRole && !collapsed && (
            <Button
              className="w-full justify-start gap-2"
              onClick={onToggleRole}
              size="sm"
              variant="ghost"
            >
              {isAdmin ? (
                <Shield className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {isAdmin ? "Admin Mode" : "User Mode"}
            </Button>
          )}

          {/* Logout */}
          <Button
            className={cn(
              "w-full gap-2",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={handleLogout}
            size="sm"
            variant="ghost"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
