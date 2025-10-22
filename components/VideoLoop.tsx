"use client";

import Image from "next/image";

type VideoLoopProps = {
  src?: string;
  blur?: number;
  mask?: "circle" | "rounded";
  showGlen?: boolean;
};

export default function VideoLoop({
  src = "/videos/placeholder.mp4",
  blur = 6,
  mask = "circle",
  showGlen = false,
}: VideoLoopProps) {
  const maskClass =
    mask === "circle" ? "rounded-full mask-circle" : "rounded-2xl";

  // Placeholder with Glen's image
  if (!src || src.includes("placeholder")) {
    return (
      <div
        className={`relative h-full w-full overflow-hidden ${maskClass}`}
      >
        {showGlen ? (
          <>
            <Image
              src="/Glen-Tullman2.jpg"
              alt="Glen Tullman"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 animate-glenPulse"
              style={{
                background:
                  "linear-gradient(135deg, hsl(180 60% 40%), hsl(195 70% 50%), hsl(245 60% 60%))",
                filter: `blur(${blur}px)`,
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${maskClass}`}>
      <video
        autoPlay
        className="h-full w-full object-cover"
        loop
        muted
        playsInline
        src={src}
        style={{ filter: `blur(${blur}px)` }}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
