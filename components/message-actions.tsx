import equal from "fast-deep-equal";
import { Copy, PencilLine, ThumbsDown, ThumbsUp } from "lucide-react";
import { memo, type ReactNode } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { Action, Actions } from "./elements/actions";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  setMode,
  rightSlot,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: "view" | "edit") => void;
  rightSlot?: ReactNode;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  // User messages get edit (on hover) and copy actions
  if (message.role === "user") {
    return (
      <Actions className="mr-1 justify-end gap-0.5 opacity-100 md:opacity-0 md:group-hover/message:opacity-100 transition-opacity">
        <div className="relative flex items-center">
          {setMode && (
            <Action
              className="-left-10 absolute top-0 opacity-100 md:opacity-0 transition-opacity md:group-hover/message:opacity-100 p-0 size-8 rounded-sm"
              onClick={() => setMode("edit")}
              tooltip="Edit"
            >
              <PencilLine />
            </Action>
          )}
          <Action className="p-0 size-8 rounded-sm" onClick={handleCopy} tooltip="Copy">
            <Copy />
          </Action>
          {rightSlot && <div className="ml-0.5 flex items-center">{rightSlot}</div>}
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="ml-1 gap-0.5 opacity-100 md:opacity-0 md:group-hover/message:opacity-100 transition-opacity">
      <Action className="p-0 size-8 rounded-sm" onClick={handleCopy} tooltip="Copy">
        <Copy />
      </Action>

      <Action
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        className="p-0 size-8 rounded-sm"
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
                      _id: `${chatId}-${message.id}`,
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
        <ThumbsUp />
      </Action>

      <Action
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
  className="p-0 size-8 rounded-sm"
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
                      _id: `${chatId}-${message.id}`,
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
        <ThumbsDown />
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

    return true;
  }
);
