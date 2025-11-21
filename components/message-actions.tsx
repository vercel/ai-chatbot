import equal from "fast-deep-equal";
import { Volume2 } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { usePlayer } from "@/hooks/use-player";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { Action, Actions } from "./elements/actions";
import {
  CopyIcon,
  LoaderIcon,
  PencilEditIcon,
  StopIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  setMode,
  player,
  ttsEnabled,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: "view" | "edit") => void;
  player?: ReturnType<typeof usePlayer>;
  ttsEnabled?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = useCallback(async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  }, [textFromParts, copyToClipboard]);

  const handlePlayTTS = useCallback(async () => {
    if (!textFromParts || !player) {
      console.log("TTS: Missing text or player", {
        hasText: !!textFromParts,
        hasPlayer: !!player,
      });
      return;
    }

    if (player.isPlaying) {
      console.log("TTS: Stopping playback");
      player.stop();
      return;
    }

    console.log(
      "TTS: Starting synthesis for text:",
      `${textFromParts.substring(0, 50)}...`
    );
    setIsLoadingTTS(true);

    try {
      const response = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textFromParts }),
      });

      console.log("TTS: Response status:", response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TTS: API error response:", errorText);
        throw new Error(`TTS failed: ${errorText}`);
      }

      if (!response.body) {
        console.error("TTS: No response body");
        throw new Error("No response body");
      }

      console.log("TTS: Got audio stream, starting playback");
      setIsLoadingTTS(false);

      await player.play(response.body, () => {
        console.log("TTS: Playback ended");
      });

      console.log("TTS: Playback started successfully");
    } catch (error) {
      console.error("TTS error:", error);
      toast.error(
        `Failed to play audio: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsLoadingTTS(false);
    }
  }, [textFromParts, player]);

  if (isLoading) {
    return null;
  }

  // User messages get edit (on hover) and copy actions
  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 justify-end">
        <div className="relative">
          {setMode && (
            <Action
              className="-left-10 absolute top-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/message:opacity-100"
              data-testid="message-edit-button"
              onClick={() => setMode("edit")}
              tooltip="Edit"
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action onClick={handleCopy} tooltip="Copy">
            <CopyIcon />
          </Action>
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5">
      <Action onClick={handleCopy} tooltip="Copy">
        <CopyIcon />
      </Action>

      {player && (
        <Action
          data-testid="message-tts-button"
          disabled={isLoadingTTS || !ttsEnabled}
          onClick={handlePlayTTS}
          tooltip={
            ttsEnabled
              ? player.isPlaying
                ? "Stop playback"
                : "Play audio"
              : "Enable TTS in voice settings to play audio"
          }
        >
          {isLoadingTTS ? (
            <LoaderIcon />
          ) : player.isPlaying ? (
            <StopIcon />
          ) : (
            <Volume2 size={16} />
          )}
        </Action>
      )}

      <Action
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={() => {
          const upvote = fetch("/api/vote", {
            method: "PATCH",
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: "up",
            }),
          });

          toast.promise(upvote, {
            loading: "Upvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: true,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Upvoted Response!";
            },
            error: "Failed to upvote response.",
          });
        }}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={() => {
          const downvote = fetch("/api/vote", {
            method: "PATCH",
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: "down",
            }),
          });

          toast.promise(downvote, {
            loading: "Downvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: false,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Downvoted Response!";
            },
            error: "Failed to downvote response.",
          });
        }}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.ttsEnabled !== nextProps.ttsEnabled) {
      return false;
    }
    if (prevProps.player?.isPlaying !== nextProps.player?.isPlaying) {
      return false;
    }
    // Check if player changed from undefined to defined or vice versa
    if ((prevProps.player === undefined) !== (nextProps.player === undefined)) {
      return false;
    }

    return true;
  }
);
