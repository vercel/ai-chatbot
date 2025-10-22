"use client";

import { AnimatePresence, motion } from "framer-motion";

type State = "idle" | "listening" | "thinking" | "speaking";

export function AvatarDock({
  state = "idle",
  text,
}: {
  state?: State;
  text?: string;
}) {
  // Don't render anything when idle
  if (state === "idle") {
    return null;
  }

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
      initial={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {state === "speaking" && text && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative max-w-[80vw] break-words rounded-2xl bg-white/95 px-4 py-3 text-sm shadow-lg ring-1 ring-zinc-200/50 backdrop-blur-sm sm:max-w-[320px] sm:text-[15px] dark:bg-zinc-800/95 dark:ring-zinc-700/50"
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-zinc-800 dark:text-zinc-100">{text}</p>
            {/* Speech bubble tail */}
            <div className="-bottom-1.5 absolute right-8 h-3 w-3 rotate-45 bg-white/95 ring-1 ring-zinc-200/50 dark:bg-zinc-800/95 dark:ring-zinc-700/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar container with golden border frame */}
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.02, 1] : 1,
        }}
        className="relative"
        transition={{
          duration: 1.2,
          repeat: state === "speaking" ? Number.POSITIVE_INFINITY : 0,
          ease: "easeInOut",
        }}
      >
        {/* Golden border frame */}
        <div
          className={`-inset-2 absolute rounded-3xl bg-gradient-to-br from-[hsl(30,80%,65%)] via-[hsl(35,85%,68%)] to-[hsl(30,80%,60%)] transition-opacity duration-300 ${
            state === "listening" || state === "speaking"
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* Avatar circle */}
        <div
          className={`relative grid h-24 w-24 place-items-center overflow-hidden rounded-3xl shadow-xl transition-shadow sm:h-36 sm:w-36 ${
            state === "speaking" ? "shadow-lg" : ""
          }`}
        >
          {/* Badge label */}
          <AnimatePresence>
            {(state === "listening" || state === "speaking") && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="-top-8 -translate-x-1/2 absolute left-1/2 z-10 whitespace-nowrap rounded-full bg-[hsl(30,80%,65%)] px-3 py-1 font-medium text-white text-xs shadow-md"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: -10 }}
              >
                {state === "listening" ? "Listening" : "Speaking"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar content */}
          {state === "speaking" ? (
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,hsl(245,60%,58%),hsl(245,60%,48%))]"
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ) : state === "thinking" ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-br from-[hsl(245,60%,58%)] to-[hsl(245,60%,48%)]">
              <span className="sr-only">Thinking</span>
              <motion.i
                animate={{ y: [0, -8, 0] }}
                className="h-2.5 w-2.5 rounded-full bg-white"
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.i
                animate={{ y: [0, -8, 0] }}
                className="h-2.5 w-2.5 rounded-full bg-white"
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.15,
                }}
              />
              <motion.i
                animate={{ y: [0, -8, 0] }}
                className="h-2.5 w-2.5 rounded-full bg-white"
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
            </div>
          ) : null}

          {/* Listening pulse ring */}
          {state === "listening" && (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0, 0.5],
              }}
              className="absolute inset-0 rounded-3xl bg-[hsl(30,80%,65%)]"
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
