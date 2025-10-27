"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { deleteTrailingMessages, createNewMessageVersion } from "@/app/(chat)/actions";
import type { ChatMessage } from "@/lib/types";
import { getTextFromMessage } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export type MessageEditorProps = {
  message: ChatMessage;
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  chatId: string;
  userId: string;
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  regenerate,
  chatId,
  userId,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [draftContent, setDraftContent] = useState<string>(
    getTextFromMessage(message)
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Textarea
        className="w-full resize-none overflow-hidden rounded-xl bg-transparent text-lg! outline-hidden"
        data-testid="message-editor"
        onChange={handleInput}
        ref={textareaRef}
        value={draftContent}
      />

      <div className="flex flex-row justify-end gap-2">
        <Button
          className="h-fit px-3 py-2"
          onClick={() => {
            setMode("view");
          }}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="h-fit px-3 py-2"
          data-testid="message-editor-send-button"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);

            try {
              // Create new message version instead of updating
              const newVersion = await createNewMessageVersion({
                originalMessageId: message.id,
                newContent: draftContent,
                chatId,
                userId,
              });

              // Update the UI with the new version
              setMessages((messages) => {
                const index = messages.findIndex((m) => m.id === message.id);

                if (index !== -1) {
                  const updatedMessage: ChatMessage = {
                    ...message,
                    id: newVersion.id,
                    parts: [{ type: "text", text: draftContent }],
                  };

                  // Remove all messages after this one (AI responses will be regenerated)
                  return [...messages.slice(0, index), updatedMessage];
                }

                return messages;
              });

              setMode("view");
              regenerate();
            } catch (error) {
              console.error("Failed to create message version:", error);
              // Fallback to old behavior if versioning fails
              await deleteTrailingMessages({
                id: message.id,
              });

              setMessages((messages) => {
                const index = messages.findIndex((m) => m.id === message.id);

                if (index !== -1) {
                  const updatedMessage: ChatMessage = {
                    ...message,
                    parts: [{ type: "text", text: draftContent }],
                  };

                  return [...messages.slice(0, index), updatedMessage];
                }

                return messages;
              });

              setMode("view");
              regenerate();
            } finally {
              setIsSubmitting(false);
            }
          }}
          variant="default"
        >
          {isSubmitting ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
