"use client";

import { useEffect } from "react";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useSidebar } from "@/components/ui/sidebar";

const SIDEBAR_WIDTH_CHAT = "30rem";
const SIDEBAR_WIDTH_ARTIFACT = "30rem";
const CHAT_WIDTH_REM = 30;
const ARTIFACT_WIDTH_REM = 30;
const COMBINED_WIDTH_REM = CHAT_WIDTH_REM + ARTIFACT_WIDTH_REM;

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
    const updateWidth = () => {
      const sidebarWrapper = document.querySelector('[data-slot="sidebar-wrapper"]') as HTMLElement;
      if (sidebarWrapper) {
        if (isArtifactVisible) {
          // Combined width: 60rem (30rem chat + 30rem artifact), but max 50% of screen width
          const maxWidthPx = window.innerWidth * 0.5;
          const combinedWidthPx = COMBINED_WIDTH_REM * 16; // Convert rem to px (assuming 1rem = 16px)
          const widthPx = Math.min(combinedWidthPx, maxWidthPx);
          sidebarWrapper.style.setProperty("--sidebar-width", `${widthPx}px`);
        } else {
          sidebarWrapper.style.setProperty("--sidebar-width", SIDEBAR_WIDTH_CHAT);
        }
      }
    };

    updateWidth();

    // Update width on window resize when artifact is visible
    if (isArtifactVisible) {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
  }, [isArtifactVisible]);

  return null;
}

