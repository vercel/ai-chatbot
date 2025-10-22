"use client";

import { toast as sonnerToast } from "sonner";

function choosePosition(): "top-center" | "bottom-center" {
  if (typeof window === "undefined") {
    return "top-center";
  }
  const isMobile = window.matchMedia?.("(max-width: 600px)")?.matches ?? false;
  return isMobile ? "bottom-center" : "top-center";
}

export const voiceToast = {
  listening() {
    sonnerToast("🎤 Listening...", {
      duration: 2000,
      position: choosePosition(),
    });
  },
  received() {
    sonnerToast("✅ Voice input received", {
      duration: 2000,
      position: choosePosition(),
    });
  },
};

export default voiceToast;
