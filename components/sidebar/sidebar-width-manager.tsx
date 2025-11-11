"use client";

import { useEffect, useState } from "react";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useSidebar } from "@/components/ui/sidebar";
import { useScreenSize } from "@/hooks/use-screen-size";

const SIDEBAR_WIDTH_CHAT = "30rem";
const CHAT_WIDTH_REM = 30;
const ARTIFACT_WIDTH_REM = 30;
const COMBINED_WIDTH_REM = CHAT_WIDTH_REM + ARTIFACT_WIDTH_REM;

// Responsive width constants
const LAPTOP_SIDEBAR_WIDTH_PERCENT = 33; // Increased from 33% for more chat space
const LAPTOP_SIDEBAR_WITH_ARTIFACT_PERCENT = 66;
const LAPTOP_EXPANDED_NO_ARTIFACT_PERCENT = 60; // Max 60% when no artifact
const LARGE_DESKTOP_MAX_PERCENT = 33.33; // 1/3 of screen
const LARGE_DESKTOP_WITH_ARTIFACT_MAX_PERCENT = 50; // 1/2 of screen (1/4 each)
// Expanded mode percentages (only when artifact is visible)
const EXPANDED_MODE_PERCENT_LAPTOP = 100; // 100% width for 50/50 split between chat and artifact
const EXPANDED_MODE_PERCENT_LARGE_DESKTOP = 66;
const REM_TO_PX = 16; // 1rem = 16px

const EXPANDED_MODE_STORAGE_KEY = "sidebar-expanded-mode";

export function SidebarWidthManager() {
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setOpen, open } = useSidebar();
  const { screenSize, width } = useScreenSize();
  const [isExpandedMode, setIsExpandedMode] = useState(false);

  // Load expanded mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(EXPANDED_MODE_STORAGE_KEY);
    if (stored === "true") {
      setIsExpandedMode(true);
    }
  }, []);

  // Expose expanded mode setter via custom event or context
  useEffect(() => {
    const handleExpandedToggle = (event: CustomEvent<boolean>) => {
      setIsExpandedMode(event.detail);
      localStorage.setItem(
        EXPANDED_MODE_STORAGE_KEY,
        event.detail ? "true" : "false"
      );
    };

    window.addEventListener(
      "sidebar-expanded-toggle",
      handleExpandedToggle as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebar-expanded-toggle",
        handleExpandedToggle as EventListener
      );
    };
  }, []);

  // Auto-open sidebar when artifact becomes visible
  useEffect(() => {
    if (isArtifactVisible && !open) {
      setOpen(true);
    }
  }, [isArtifactVisible, open, setOpen]);

  // Update sidebar width CSS variable
  useEffect(() => {
    const updateWidth = () => {
      const sidebarWrapper = document.querySelector(
        '[data-slot="sidebar-wrapper"]'
      ) as HTMLElement;
      if (!sidebarWrapper || !width) return;

      let widthPx: number;

      if (isExpandedMode) {
        // Expanded mode: Overrides all other width calculations
        if (screenSize === "large-desktop") {
          widthPx = width * (EXPANDED_MODE_PERCENT_LARGE_DESKTOP / 100);
        } else if (screenSize === "laptop") {
          // On laptop, expanded behavior depends on artifact visibility
          if (isArtifactVisible) {
            // 100% width for true 50/50 split between chat and artifact (main content hidden)
            widthPx = width * (EXPANDED_MODE_PERCENT_LAPTOP / 100);
          } else {
            // Max 60% when no artifact
            widthPx = width * (LAPTOP_EXPANDED_NO_ARTIFACT_PERCENT / 100);
          }
        } else {
          // Mobile: Use 90% for expanded
          widthPx = width * 0.9;
        }
      } else if (screenSize === "large-desktop") {
        // Large Desktop (4K+)
        if (isArtifactVisible) {
          // With artifact: 50% total (1/4 each for chat and artifact)
          widthPx = width * (LARGE_DESKTOP_WITH_ARTIFACT_MAX_PERCENT / 100);
        } else {
          // Default: 1/3 of screen width
          const targetWidthPx = width * (LARGE_DESKTOP_MAX_PERCENT / 100);
          const chatWidthPx = CHAT_WIDTH_REM * REM_TO_PX;
          widthPx = Math.min(chatWidthPx, targetWidthPx);
        }
      } else if (screenSize === "laptop") {
        // Laptop
        if (isArtifactVisible) {
          // With artifact: 66% of screen width (1/3 each), but cap at 60rem if screen is very wide
          const targetWidthPx = width * (LAPTOP_SIDEBAR_WITH_ARTIFACT_PERCENT / 100);
          const combinedWidthPx = COMBINED_WIDTH_REM * REM_TO_PX;
          // Use the smaller of: 66% of screen or 60rem (to prevent it from getting too wide on very large laptops)
          widthPx = Math.min(combinedWidthPx, targetWidthPx);
        } else {
          // Default: ~36% of screen width (max 30rem)
          const targetWidthPx = width * (LAPTOP_SIDEBAR_WIDTH_PERCENT / 100);
          const chatWidthPx = CHAT_WIDTH_REM * REM_TO_PX;
          widthPx = Math.min(chatWidthPx, targetWidthPx);
        }
      } else {
        // Mobile: Use default rem-based width
        if (isArtifactVisible) {
          const combinedWidthPx = COMBINED_WIDTH_REM * REM_TO_PX;
          widthPx = Math.min(combinedWidthPx, width * 0.9); // Max 90% on mobile
        } else {
          widthPx = CHAT_WIDTH_REM * REM_TO_PX;
        }
      }

      sidebarWrapper.style.setProperty("--sidebar-width", `${widthPx}px`);
      
      // Add data attribute for expanded mode on laptop to hide main content
      // Only when sidebar is open, expanded mode is active, artifact is visible, and on laptop
      if (open && isExpandedMode && isArtifactVisible && screenSize === "laptop") {
        sidebarWrapper.setAttribute("data-expanded-laptop", "true");
      } else {
        sidebarWrapper.removeAttribute("data-expanded-laptop");
      }
    };

    updateWidth();

    // Update width on window resize
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isArtifactVisible, screenSize, width, isExpandedMode, open]);

  return null;
}

