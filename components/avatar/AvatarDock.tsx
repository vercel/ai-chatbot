"use client";

type State = "idle" | "listening" | "thinking" | "speaking";

export function AvatarDock({
  state = "idle",
  text,
}: {
  state?: State;
  text?: string;
}) {
  const containerClassName =
    "fixed bottom-2 flex flex-col gap-2 items-end right-2 z-40 sm:bottom-4 sm:right-4";
  const bubbleClassName =
    "bg-white/90 dark:bg-zinc-900/90 break-words max-w-[80vw] rounded-xl p-2 shadow text-xs sm:max-w-[320px] sm:p-3 sm:text-sm";
  const avatarBaseClassName =
    "grid place-items-center size-20 overflow-hidden rounded-full sm:size-36";
  return (
    <div className={containerClassName}>
      {state === "speaking" && text && (
        <div className={bubbleClassName}>
          {text}
        </div>
      )}
      <div
        role="img"
        aria-label="Glen avatar"
        className={[
          avatarBaseClassName,
          state === "speaking" ? "animate-glenPulse shadow-lg" : "shadow",
          state === "listening" ? "ring-2 ring-[--primary]" : "",
        ].join(" ")}
      >
        {/* idle / listening / thinking use initials; speaking shows a simple animated gradient */}
        {state === "speaking" ? (
          <div className="size-full bg-[radial-gradient(circle_at_30%_30%,var(--primary),var(--primary-dark))]" />
        ) : state === "thinking" ? (
          <div className="flex items-center gap-1">
            <span className="sr-only">Thinking</span>
            <i className="size-2 animate-bounce rounded-full bg-[--primary] [animation-delay:-0ms]" />
            <i className="size-2 animate-bounce rounded-full bg-[--primary] [animation-delay:120ms]" />
            <i className="size-2 animate-bounce rounded-full bg-[--primary] [animation-delay:240ms]" />
          </div>
        ) : (
          <span className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_30%,var(--primary),var(--primary-dark))] font-semibold text-primary-foreground">
            GT
          </span>
        )}
      </div>
    </div>
  );
}
