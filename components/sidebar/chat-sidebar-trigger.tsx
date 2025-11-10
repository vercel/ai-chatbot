"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MessageIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

export function ChatSidebarTrigger() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <Button
      className={cn(
        "ml-auto transition-opacity ease-in-out duration-250",
        open && "opacity-0 pointer-events-none"
      )}
      onClick={toggleSidebar}
      type="button"
      variant="secondary"
    >
      <MessageIcon size={16} />
      <span className=" hidden sm:inline">Chat</span>
    </Button>
  );
}
