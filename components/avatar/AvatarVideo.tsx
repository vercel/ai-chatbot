"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type AvatarState = "idle" | "listening" | "speaking";

type AvatarVideoProps = {
  state?: AvatarState;
  className?: string;
};

export function AvatarVideo(props: AvatarVideoProps) {
  const { state = "idle", className } = props;

  const ringColor = "var(--transcarent-gold)";

  const ringClasses = useMemo(() => {
    if (state === "listening") {
      return "opacity-100";
    }
    if (state === "speaking") {
      return "opacity-60";
    }
    return "opacity-0";
  }, [state]);

  return (
    <div className={cn("relative aspect-square w-full max-w-sm", className)}>
      <style>{`
@keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }
      `}</style>
      <div
        aria-hidden
        className={cn(
          "mask-circle h-full w-full rounded-full",
          "blur-md",
          "bg-[radial-gradient(120%_120%_at_0%_0%,_var(--transcarent-blue)_0%,_transparent_40%),_radial-gradient(120%_120%_at_100%_100%,_var(--transcarent-gold)_0%,_transparent_40%)]"
        )}
        style={{
          backgroundSize: "200% 200%",
          animation: "gradientShift 6s ease-in-out infinite",
        }}
      />
      <div className={cn("absolute inset-0 flex items-center justify-center")}>
        <div className="h-[86%] w-[86%] rounded-full bg-black/10" />
      </div>
      <div
        aria-hidden
        className={cn(
          "-z-10 pointer-events-none absolute inset-0 flex items-center justify-center",
          ringClasses
        )}
      >
        <div
          className="h-[96%] w-[96%] rounded-full"
          style={{
            boxShadow: `0 0 0 2px ${ringColor}`,
            animation:
              state === "idle"
                ? undefined
                : "pulseRing 1400ms ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

export default AvatarVideo;
