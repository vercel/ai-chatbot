"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useConsoleLogs } from "@/hooks/use-console-logs";
import {
  isDevelopmentEnvironment,
  isStagingEnvironment,
  getEnvironmentType,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogsIcon } from "@/components/shared/icons";

export function DevBar() {
  const [user, setUser] = useState<User | null>(null);
  const nextPathname = usePathname();
  const { logCount, copyLogsToClipboard } = useConsoleLogs();
  const [copied, setCopied] = useState(false);
  const [pathname, setPathname] = useState<string>(
    typeof window !== "undefined" ? window.location.pathname : nextPathname
  );

  // Check Supabase auth state
  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Use window.location.pathname as the source of truth for the actual browser URL
  // This ensures we always show the real browser path, including after redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Always use the actual browser URL - this catches server-side redirects
      setPathname(window.location.pathname);
    }
  }, [nextPathname]);

  const envType = getEnvironmentType();
  const isDev = isDevelopmentEnvironment;
  const isStaging = isStagingEnvironment;

  // Only render in dev or staging
  if (!isDev && !isStaging) {
    return null;
  }

  const gitBranch =
    process.env.NEXT_PUBLIC_GIT_BRANCH || "unknown";

  const handleCopyLogs = async () => {
    const success = await copyLogsToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const envColors = {
    development: "bg-blue-950/50 border-blue-800/50 text-blue-200",
    staging: "bg-amber-950/50 border-amber-800/50 text-amber-200",
  };

  const envColor = envColors[envType];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-7 items-center gap-2 border-t px-3 text-xs font-mono",
        envColor
      )}
    >
      {/* Auth Status */}
      <Badge
        variant="outline"
        className="h-5 border-current/30 bg-transparent px-1.5 text-[10px]"
      >
        {user ? (
          <>
            {user.email || "Logged in"} (user)
          </>
        ) : (
          "Logged out"
        )}
      </Badge>

      {/* Git Branch */}
      <Badge
        variant="outline"
        className="h-5 border-current/30 bg-transparent px-1.5 text-[10px]"
      >
        {gitBranch}
      </Badge>

      {/* Current Route */}
      <span className="truncate text-[10px] opacity-70">{pathname}</span>

      <div className="flex-1" />

      {/* Dev-only quick links */}
      {isDev && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-[10px] hover:bg-current/10"
            onClick={() => {
              window.open("http://localhost:54323", "_blank");
            }}
          >
            Supabase
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-[10px] hover:bg-current/10"
            onClick={() => {
              window.open("http://localhost:54324", "_blank");
            }}
          >
            Mailpit
          </Button>
        </>
      )}

      {/* Console Logs */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-5 gap-1 px-2 text-[10px] hover:bg-current/10"
        onClick={handleCopyLogs}
        title="Copy console logs as markdown"
      >
        <LogsIcon size={12} />
        {logCount > 0 && (
          <Badge
            variant="outline"
            className="h-3 min-w-3 border-current/30 bg-current/20 px-0.5 text-[9px]"
          >
            {logCount}
          </Badge>
        )}
        {copied && (
          <span className="ml-1 text-[9px] opacity-70">Copied!</span>
        )}
      </Button>
    </div>
  );
}

