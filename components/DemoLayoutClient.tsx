"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RouteTransition from "@/components/RouteTransition";
import UnifiedSidebar from "@/components/UnifiedSidebar";
import { RoleProvider, useRole } from "@/lib/contexts/RoleContext";
import { MemoryProvider } from "@/lib/contexts/MemoryContext";
import { SessionProvider, useSession } from "@/lib/contexts/SessionContext";

function DemoLayoutInner({ children }: { children: ReactNode }) {
  const { isAdmin, toggleRole } = useRole();
  const { currentSessionId, setCurrentSessionId, createNewSession } = useSession();
  const router = useRouter();

  const handleNewChat = () => {
    createNewSession();
    router.push("/chat");
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    router.push("/chat");
  };

  return (
    <div className="flex h-screen">
      <UnifiedSidebar
        isAdmin={isAdmin}
        onToggleRole={toggleRole}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      <main className="flex-1 overflow-auto p-6" id="content">
        <ErrorBoundary>
          <RouteTransition>{children}</RouteTransition>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function DemoLayoutClient({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <MemoryProvider>
        <SessionProvider>
          <DemoLayoutInner>{children}</DemoLayoutInner>
        </SessionProvider>
      </MemoryProvider>
    </RoleProvider>
  );
}
