"use client";

import type { ChatStatus } from "ai";
import { Loader2Icon, SendIcon, SquareIcon, XIcon } from "lucide-react";
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from "react";
import { Children, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import React from "react";

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={cn(
      "w-full overflow-hidden rounded-xl border bg-background shadow-xs",
      className
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  disableAutoResize?: boolean;
  resizeOnNewLinesOnly?: boolean;
};


export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(
  (
    {
      onChange,
      className,
      placeholder = "Hi, there! How can I help you today?",
      minHeight = 48,
      maxHeight = 164,
      disableAutoResize = false,
      resizeOnNewLinesOnly = false,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef =
      (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const prevLineCountRef = useRef<number>(0);

    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || disableAutoResize) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [disableAutoResize, maxHeight, minHeight, textareaRef]);

    useEffect(() => {
      adjustHeight();
    }, [disableAutoResize, minHeight, maxHeight]);

    useEffect(() => {
      if (disableAutoResize) return;

      const currentValue = props.value?.toString() || "";

      if (resizeOnNewLinesOnly) {
        const currentLineCount = (currentValue.match(/\n/g) || []).length;
        if (currentLineCount !== prevLineCountRef.current) {
          adjustHeight();
          prevLineCountRef.current = currentLineCount;
        }
      } else {
        adjustHeight();
      }
    }, [props.value, disableAutoResize, resizeOnNewLinesOnly]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (e.key === "Enter") {
        // Don't submit if IME composition is in progress
        if (e.nativeEvent.isComposing) {
          return;
        }
        if (e.shiftKey) {
          // Allow newline
          return;
        }
        e.preventDefault();
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    return (
      <Textarea
        ref={textareaRef}
        className={cn(
          "w-full resize-none rounded-none border-none p-3 shadow-none outline-hidden ring-0",
          "bg-transparent dark:bg-transparent",
          "focus-visible:ring-0",
          disableAutoResize && "field-sizing-content max-h-[6lh]",
          className
        )}
        style={
          disableAutoResize
            ? undefined
            : {
                minHeight: `${minHeight}px`,
                maxHeight: `${maxHeight}px`,
              }
        }
        name="message"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);
PromptInputTextarea.displayName = "PromptInputTextarea";

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn("flex items-center justify-between p-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      "flex items-center gap-1",
      "[&_button:first-child]:rounded-bl-xl",
      className
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? "default" : "icon";

  return (
    <Button
      className={cn(
        "shrink-0 gap-1.5 rounded-lg",
        variant === "ghost" && "text-muted-foreground",
        newSize === "default" && "px-3",
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="size-4" />;

  if (status === "submitted") {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <Button
      className={cn("gap-1.5 rounded-lg", className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      "hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
      "h-auto px-2 py-1.5",
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);
