import React, { forwardRef, useEffect, useRef } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../avatar-stream-hooks/useConnectionQuality";
import { useStreamingAvatarSession } from "../avatar-stream-hooks/useStreamingAvatarSession";
import { Button } from "@/components/ui/button";
import { CloseIcon, MicIcon, MicOffIcon } from "../ui/Icons";
import {
  StreamingAvatarSessionState,
  useVoiceChat,
} from "../avatar-stream-hooks";
import { cn } from "@/lib/utils";

export const ConnectionQualityIndicator = ({
  className,
}: {
  className?: string;
}) => {
  const { connectionQuality } = useConnectionQuality();
  if (connectionQuality === ConnectionQuality.UNKNOWN) return null;
  return (
    <div className={cn("text-gray-300 text-sm w-full text-center", className)}>
      Connection Quality: {connectionQuality}
    </div>
  );
};

export const AvatarVideo = forwardRef<
  HTMLVideoElement,
  { handleStop: () => void }
>(({ handleStop }, ref) => {
  const { sessionState } = useStreamingAvatarSession();
  const { isMuted, isVoiceChatActive, muteInputAudio, unmuteInputAudio } =
    useVoiceChat();
  const containerSize = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;
  const containerElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerElement.current) {
      containerSize.current.width = containerElement.current.clientWidth;
      containerSize.current.height = containerElement.current.clientHeight;
    }
  }, [containerElement]);

  const ZOOM_LEVEL = 1;
  const Y_OFFSET_PX = 0;
  const X_OFFSET_PX = 0;

  return (
    <div
      className="relative flex flex-col items-center justify-center aspect-square h-full rounded-xl"
      ref={containerElement}
    >
      {isLoaded && (
        <>
          {/* This container is used to mask the video size -- the video gets constrained to 9:16 by the parent and then use absolute positioning to place in container */}
          <div className="relative aspect-square overflow-hidden rounded-xl h-full w-full">
            <video
              ref={ref}
              autoPlay
              playsInline
              className="rounded-xl overflow-hidden"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `scale(${ZOOM_LEVEL}) translate(${X_OFFSET_PX}px, ${Y_OFFSET_PX}px)`,
                transformOrigin: "center center",
                // objectPosition: "center bottom",
                // top: `${TOP_OFFSET_PCT}%`,
                // left: `${X_OFFSET_PCT}%`,
              }}
            >
              <track kind="captions" />
            </video>

            {/* Controls: close + mic toggle, side by side */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10000 flex items-center gap-2">
              <Button
                variant="default"
                size="icon"
                className="text-white bg-zinc-900/80 hover:bg-zinc-900 dark:bg-zinc-800/80 dark:hover:bg-zinc-800"
                onClick={handleStop}
                aria-label="Close session"
                title="Close"
              >
                <CloseIcon />
              </Button>
              <Button
                variant="default"
                size="icon"
                className={`text-white ${
                  isMuted
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    : "bg-zinc-900/80 hover:bg-zinc-900 dark:bg-zinc-800/80 dark:hover:bg-zinc-800"
                }`}
                onClick={() => {
                  if (!isVoiceChatActive) return;
                  if (isMuted) {
                    unmuteInputAudio();
                  } else {
                    muteInputAudio();
                  }
                }}
                aria-pressed={isMuted}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                disabled={!isVoiceChatActive}
                title={
                  isVoiceChatActive
                    ? isMuted
                      ? "Unmute microphone"
                      : "Mute microphone"
                    : "Voice chat inactive"
                }
              >
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

AvatarVideo.displayName = "AvatarVideo";
