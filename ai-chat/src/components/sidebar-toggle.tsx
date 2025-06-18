import type { ComponentProps } from "react";
import {
  type SidebarTrigger,
  useSidebar,
} from "@ai-chat/components/ui/sidebar";
import { SidebarLeftIcon } from "@ai-chat/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ai-chat/components/ui/tooltip";
import { Button } from "@ai-chat/components/ui/button";

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="outline"
          className="md:px-2 md:h-fit"
        >
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
