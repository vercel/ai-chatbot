"use client";

type VideoLoopProps = {
  src?: string;
  blur?: number;
  mask?: "circle" | "rounded";
};

export default function VideoLoop({
  src = "/videos/placeholder.mp4",
  blur = 10,
  mask = "circle",
}: VideoLoopProps) {
  const maskClass =
    mask === "circle" ? "rounded-full mask-circle" : "rounded-2xl";

  // Placeholder gradient (until video is ready)
  if (!src || src.includes("placeholder")) {
    return (
      <div
        className={`relative h-full min-h-[200px] w-full overflow-hidden ${maskClass}`}
      >
        <div
          className="absolute inset-0 animate-glenPulse"
          style={{
            background:
              "linear-gradient(135deg, hsl(180 60% 40%), hsl(195 70% 50%), hsl(245 60% 60%))",
            filter: `blur(${blur}px)`,
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
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
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
