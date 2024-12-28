import type { ComponentProps } from "react";

import { type SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { HistoryIcon } from "./icons";
import { Button } from "./ui/button";

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          variant="outline"
          className="md:px-2 md:h-fit"
        >
          <HistoryIcon size={16} /> History
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle History</TooltipContent>
    </Tooltip>
  );
}
