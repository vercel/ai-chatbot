"use client";

import { useEffect } from "react";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useSidebar } from "@/components/ui/sidebar";

const SIDEBAR_WIDTH_CHAT = "24rem";
const SIDEBAR_WIDTH_WITH_ARTIFACT = "52rem"; // 24rem chat + 28rem artifact

export function SidebarWidthManager() {
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setOpen, open } = useSidebar();

  // Auto-open sidebar when artifact becomes visible
  useEffect(() => {
    if (isArtifactVisible && !open) {
      setOpen(true);
    }
  }, [isArtifactVisible, open, setOpen]);

  // Update sidebar width CSS variable
  useEffect(() => {
    const sidebarWrapper = document.querySelector('[data-slot="sidebar-wrapper"]') as HTMLElement;
    if (sidebarWrapper) {
      sidebarWrapper.style.setProperty(
        "--sidebar-width",
        isArtifactVisible ? SIDEBAR_WIDTH_WITH_ARTIFACT : SIDEBAR_WIDTH_CHAT
      );
    }
  }, [isArtifactVisible]);

  return null;
}

