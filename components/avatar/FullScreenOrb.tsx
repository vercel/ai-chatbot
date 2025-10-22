"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";

export function FullScreenOrb({
  state = "idle",
  text,
  size = 400,
  className,
  showAvatar = false,
  videoRef,
  isConnected = false,
  preferPhoto = false,
}: {
  state?: "idle" | "listening" | "thinking" | "speaking";
  text?: string;
  size?: number;
  className?: string;
  showAvatar?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  isConnected?: boolean;
  preferPhoto?: boolean;
}) {
  const getStateClasses = () => {
    const baseClasses =
      "rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--primary),hsl(var(--primary)/0.7))] relative flex items-center justify-center transition-all duration-500";

    switch (state) {
      case "listening":
        return cn(
          baseClasses,
          "animate-pulse shadow-md shadow-primary/30 ring-2 ring-primary"
        );
      case "thinking":
        return cn(baseClasses, "shadow-md shadow-primary/20");
      case "speaking":
        return cn(baseClasses, "animate-glenPulse shadow-lg shadow-primary/40");
      default:
        return cn(baseClasses, "shadow-md shadow-primary/10");
    }
  };

  const getResponsiveSize = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        return Math.min(size * 0.7, 280);
      }
      if (window.innerWidth < 1024) {
        return Math.min(size * 0.8, 320);
      }
    }
    return size;
  };

  const orbSize = getResponsiveSize();

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        {text && state === "speaking" && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full z-30 mb-8 max-w-[90vw] sm:max-w-lg"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative max-h-[50vh] overflow-y-auto rounded-xl border border-border/50 bg-card p-4 shadow-lg backdrop-blur-sm">
              <p className="text-card-foreground text-sm leading-relaxed sm:text-base">
                {text}
              </p>
              {/* Arrow pointing down */}
              <div className="-translate-x-1/2 -bottom-2 absolute left-1/2 h-4 w-4 rotate-45 border-border/50 border-r border-b bg-card" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Orb */}
      <motion.div
        animate={
          state === "speaking"
            ? {
                rotate: 360,
                background: [
                  "radial-gradient(circle at 30% 30%, hsl(var(--primary)), hsl(var(--primary)/0.7))",
                  "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.9), hsl(var(--primary)/0.6))",
                  "radial-gradient(circle at 30% 30%, hsl(var(--primary)), hsl(var(--primary)/0.7))",
                ],
              }
            : state === "idle"
              ? {
                  scale: [1, 1.02, 1],
                }
              : {}
        }
        aria-label={`Avatar state: ${state}`}
        aria-live="polite"
        className={getStateClasses()}
        style={{
          width: orbSize,
          height: orbSize,
          // Enhanced styling for speaking state
          ...(state === "speaking" && {
            boxShadow:
              "0 0 60px var(--primary), 0 0 120px var(--primary), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }),
        }}
        transition={
          state === "speaking"
            ? {
                rotate: {
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                },
                background: {
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
              }
            : state === "idle"
              ? {
                  scale: {
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  },
                }
              : {}
        }
      >
        {/* Inner glow effect */}
        <div
          className="absolute inset-0 rounded-full border border-white/10"
          style={{
            boxShadow: "inset 0 0 40px hsl(var(--primary)/0.3)",
          }}
        />

        {/* HeyGen Video Stream - shown when connected unless preferPhoto */}
        {showAvatar && isConnected && videoRef && !preferPhoto && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            style={{
              width: orbSize * 0.85,
              height: orbSize * 0.85,
            }}
            transition={{ duration: 0.5 }}
          >
            <video
              autoPlay
              className="h-full w-full object-cover"
              playsInline
              ref={videoRef}
            >
              <track kind="captions" />
            </video>
          </motion.div>
        )}

        {/* Glen's Avatar Photo - shown when preferPhoto or when idle/not connected */}
        {showAvatar && (preferPhoto || (!isConnected && state === "idle")) && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            style={{
              width: orbSize * 0.85,
              height: orbSize * 0.85,
            }}
            transition={{ duration: 0.5 }}
          >
            <Image
              alt="Glen Tullman"
              className="object-cover"
              fill
              priority
              src="/Glen-Tullman2.jpg"
            />
          </motion.div>
        )}

        {/* Thinking dots */}
        {state === "thinking" && (
          <div className="flex items-center justify-center gap-2">
            {[0, 120, 240].map((delay) => (
              <motion.div
                animate={{
                  y: [-8, 0, -8],
                }}
                className="size-3 rounded-full bg-primary-foreground"
                key={delay}
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: delay / 1000,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Screen reader text */}
        <span className="sr-only">
          {state === "idle" && "Avatar is idle"}
          {state === "listening" && "Avatar is listening"}
          {state === "thinking" && "Avatar is thinking"}
          {state === "speaking" && text ? text : "Avatar is speaking"}
        </span>
      </motion.div>
    </div>
  );
}
