"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { apiFetch } from "@/lib/api-client";
import type { Vote } from "@/lib/db/schema";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";

type MessageFeedbackProps = {
  chatId: string;
  messageId: string;
  vote: Vote | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MAX_FEEDBACK_LENGTH = 2000;

export function MessageFeedback({
  chatId,
  messageId,
  vote,
  open,
  onOpenChange,
}: MessageFeedbackProps) {
  const { mutate } = useSWRConfig();
  const [feedback, setFeedback] = useState(vote?.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update feedback state when vote changes or sheet opens
  useEffect(() => {
    if (open) {
      setFeedback(vote?.feedback || "");
    }
  }, [vote?.feedback, open]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedFeedback = feedback.trim();

    setIsSubmitting(true);

    try {
      // Submit feedback only (no vote type) - preserves existing vote if it exists
      // Only send vote type if there's an actual vote (true or false), not if it's null
      const voteType = vote?.isUpvoted === true
        ? "up"
        : vote?.isUpvoted === false
          ? "down"
          : null;

      await apiFetch("/api/vote", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          messageId,
          type: voteType,
          feedback: trimmedFeedback || null,
        }),
      });

      // Update the vote in cache
      mutate<Vote[]>(
        `/api/vote?chatId=${chatId}`,
        (currentVotes) => {
          if (!currentVotes) {
            // If no votes exist and we're submitting feedback-only, create a new entry
            return [
              {
                chatId,
                messageId,
                isUpvoted: null,
                feedback: trimmedFeedback || null,
              },
            ];
          }

          const votesWithoutCurrent = currentVotes.filter(
            (currentVote) => currentVote.messageId !== messageId
          );

          return [
            ...votesWithoutCurrent,
            {
              chatId,
              messageId,
              isUpvoted: vote?.isUpvoted ?? null,
              feedback: trimmedFeedback || null,
            },
          ];
        },
        { revalidate: false }
      );

      toast.success("Thank you! Your feedback has been submitted.");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_FEEDBACK_LENGTH) {
      setFeedback(value);
    }
  };

  const characterCount = feedback.length;
  const isNearLimit = characterCount > MAX_FEEDBACK_LENGTH * 0.9;
  const hasFeedback = feedback.trim().length > 0;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="left-1/2 top-1/2 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border sm:max-h-[80vh] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        side="bottom"
      >
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-hidden">
          <SheetHeader className="pb-4 text-left">
            <SheetTitle className="text-xl">Feedback on AI Response</SheetTitle>
            <SheetDescription className="text-base">
              Help us improve by sharing your thoughts about this AI response. What
              did you find helpful? What could be better? Your feedback helps us
              enhance future responses.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-3 overflow-hidden">
            <div className="flex flex-col gap-2">
              <Label
                className="text-sm font-medium text-foreground"
                htmlFor="feedback-textarea"
              >
                Your Feedback
              </Label>
              <div className="relative flex-1">
                <Textarea
                  autoFocus
                  className="min-h-[180px] resize-none text-base leading-relaxed sm:min-h-[200px]"
                  id="feedback-textarea"
                  onChange={handleFeedbackChange}
                  placeholder="For example:&#10;&#10;• What did you find helpful about this response?&#10;• What could be improved or clarified?&#10;• Any specific suggestions for better responses?"
                  value={feedback}
                />
                <div
                  className={`mt-2 flex items-center justify-end text-xs ${
                    isNearLimit
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  <span>
                    {characterCount} / {MAX_FEEDBACK_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 border-t pt-4 sm:gap-3">
            <Button
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !hasFeedback}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
