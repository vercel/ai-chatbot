"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  Shield,
  Sparkles,
  Sun,
  User,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ChatSession = {
  id: string;
  title: string;
  type: "chat" | "call" | "avatar";
  timestamp: Date;
  hasTranscript?: boolean;
  resumable: boolean;
};

const mockSessions: ChatSession[] = [
  {
    id: "1",
    title: "Healthcare Philosophy",
    type: "chat",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    resumable: true,
  },
  {
    id: "2",
    title: "Leadership Call",
    type: "call",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    hasTranscript: true,
    resumable: true,
  },
  {
    id: "3",
    title: "Innovation Discussion",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    hasTranscript: true,
    resumable: false,
  },
  {
    id: "4",
    title: "Building high-performing teams",
    type: "chat",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    resumable: true,
  },
  {
    id: "5",
    title: "Digital Health Innovation",
    type: "call",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    hasTranscript: true,
    resumable: true,
  },
  {
    id: "6",
    title: "Patient engagement strategies",
    type: "chat",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    resumable: true,
  },
  {
    id: "7",
    title: "Scaling healthcare tech startups",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    hasTranscript: true,
    resumable: false,
  },
  {
    id: "8",
    title: "Patient Experience Focus",
    type: "chat",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    resumable: true,
  },
  {
    id: "9",
    title: "AI in healthcare delivery",
    type: "call",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    hasTranscript: true,
    resumable: true,
  },
  {
    id: "10",
    title: "Improving accessibility",
    type: "chat",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    resumable: true,
  },
  {
    id: "11",
    title: "Tech Stack Discussion",
    type: "call",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    hasTranscript: true,
    resumable: true,
  },
  {
    id: "12",
    title: "Future of telemedicine",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    hasTranscript: true,
    resumable: false,
  },
  {
    id: "13",
    title: "Regulatory challenges in healthtech",
    type: "chat",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    resumable: true,
  },
  {
    id: "14",
    title: "Career advice for healthcare leaders",
    type: "call",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    hasTranscript: true,
    resumable: true,
  },
  {
    id: "15",
    title: "Transcarent's mission and vision",
    type: "avatar",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
    hasTranscript: true,
    resumable: false,
  },
];

const typeIcons = {
  chat: MessageSquare,
  call: Phone,
  avatar: Video,
};

const adminNavItems = [
  { href: "/discovery", label: "Knowledge", icon: Sparkles },
  { href: "/cms", label: "Content", icon: BookOpen },
  { href: "/guardrails", label: "Guardrails", icon: Shield },
  { href: "/users", label: "Users", icon: Users },
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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleLogout = () => {
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getThemeIcon = () => {
    return theme === "dark" ? Moon : Sun;
  };

  const getThemeLabel = () => {
    return theme === "dark" ? "Dark" : "Light";
  };

  const ThemeIcon = getThemeIcon();

  const renderSession = (session: ChatSession) => {
    const Icon = typeIcons[session.type];
    const isActive = session.id === currentSessionId;
    const hasContent = ["1", "2", "3"].includes(session.id);
    const tooltipText = hasContent
      ? session.title
      : `${session.title} (Demo placeholder - no content)`;

    // Color schemes for each chat type
    const typeStyles = {
      chat: {
        container: isActive
          ? "bg-blue-500/20 ring-1 ring-blue-500/50"
          : "bg-blue-500/10",
        icon: "text-blue-600 dark:text-blue-400",
      },
      call: {
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
          "hover:bg-accent",
          isActive && "bg-accent",
          !hasContent && "opacity-60",
          collapsed && "flex items-center justify-center"
        )}
        key={session.id}
        onClick={() => onSessionSelect?.(session.id)}
        title={collapsed ? tooltipText : hasContent ? undefined : tooltipText}
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
              <div className="flex items-center gap-2">
                <div className="line-clamp-1 flex-1 text-sm">
                  {session.title}
                </div>
                {!session.resumable && (
                  <div className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    View Only
                  </div>
                )}
              </div>
              {session.hasTranscript && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  Transcript available
                </div>
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
        <h3 className="mb-1 px-2.5 font-medium text-muted-foreground text-xs">
          {title}
        </h3>
        <div>{sessionList.map(renderSession)}</div>
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
          <Link className="font-semibold text-xl hover:opacity-80" href="/">
            Glen AI
          </Link>
        )}
        <Button
          className={cn("shrink-0", collapsed && "mx-auto")}
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
        <Link className="block" href="/avatar">
          <Button
            className={cn(
              "w-full bg-primary text-primary-foreground hover:bg-primary/90",
              collapsed ? "justify-center px-2" : "justify-start gap-2"
            )}
            variant="default"
          >
            <Video className="h-4 w-4" />
            {!collapsed && <span>Video Avatar</span>}
          </Button>
        </Link>

        <Button
          className={cn(
            "w-full",
            collapsed ? "justify-center px-2" : "justify-start gap-2"
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
          {onToggleRole && (
            <Button
              className={cn(
                "w-full gap-2",
                collapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={onToggleRole}
              size="sm"
              title={
                collapsed ? (isAdmin ? "Admin Mode" : "User Mode") : undefined
              }
              variant="ghost"
            >
              {isAdmin ? (
                <Shield className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {!collapsed && (isAdmin ? "Admin Mode" : "User Mode")}
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            className={cn(
              "w-full gap-2",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={toggleTheme}
            size="sm"
            title={collapsed ? `Theme: ${mounted ? getThemeLabel() : ''}` : undefined}
            variant="ghost"
          >
            {mounted ? <ThemeIcon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {!collapsed && <span>Theme: {mounted ? getThemeLabel() : 'Loading...'}</span>}
          </Button>

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
