"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";

export function FullScreenOrb({
  state = "idle",
  text,
  size = 400,
  className,
  showAvatar = false,
  videoRef,
  isConnected = false,
}: {
  state?: "idle" | "listening" | "thinking" | "speaking";
  text?: string;
  size?: number;
  className?: string;
  showAvatar?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  isConnected?: boolean;
}) {
  const getStateClasses = () => {
    const baseClasses =
      "rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--primary),hsl(var(--primary)/0.7))] relative flex items-center justify-center transition-all duration-500";

    switch (state) {
      case "listening":
        return cn(
          baseClasses,
          "ring-2 ring-primary animate-pulse shadow-lg shadow-primary/30"
        );
      case "thinking":
        return cn(baseClasses, "shadow-lg shadow-primary/20");
      case "speaking":
        return cn(
          baseClasses,
          "shadow-2xl shadow-primary/40 animate-glenPulse"
        );
      default:
        return cn(baseClasses, "shadow-md shadow-primary/10");
    }
  };

  const getResponsiveSize = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return Math.min(size * 0.7, 280);
      if (window.innerWidth < 1024) return Math.min(size * 0.8, 320);
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-full mb-8 max-w-[90vw] sm:max-w-lg z-30"
          >
            <div className="relative rounded-xl bg-card p-4 shadow-lg border border-border/50 backdrop-blur-sm max-h-[50vh] overflow-y-auto">
              <p className="text-sm sm:text-base text-card-foreground leading-relaxed">
                {text}
              </p>
              {/* Arrow pointing down */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 rotate-45 bg-card border-r border-b border-border/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Orb */}
      <motion.div
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
        transition={
          state === "speaking"
            ? {
                rotate: {
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                },
                background: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
            : state === "idle"
            ? {
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
            : {}
        }
        aria-live="polite"
        aria-label={`Avatar state: ${state}`}
      >
        {/* Inner glow effect */}
        <div
          className="absolute inset-0 rounded-full border border-white/10"
          style={{
            boxShadow: "inset 0 0 40px hsl(var(--primary)/0.3)",
          }}
        />

        {/* HeyGen Video Stream - shown when connected */}
        {showAvatar && isConnected && videoRef && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-full overflow-hidden"
            style={{
              width: orbSize * 0.85,
              height: orbSize * 0.85,
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            >
              <track kind="captions" />
            </video>
          </motion.div>
        )}

        {/* Glen's Avatar Photo - shown when idle/not connected in avatar mode */}
        {showAvatar && !isConnected && state === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-full overflow-hidden"
            style={{
              width: orbSize * 0.85,
              height: orbSize * 0.85,
            }}
          >
            <Image
              src="/Glen-Tullman2.jpg"
              alt="Glen Tullman"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        )}

        {/* Thinking dots */}
        {state === "thinking" && (
          <div className="flex gap-2 items-center justify-center">
            {[0, 120, 240].map((delay, i) => (
              <motion.div
                key={i}
                className="size-3 rounded-full bg-primary-foreground"
                animate={{
                  y: [-8, 0, -8],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
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
