"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import { memo, useState, useEffect } from "react";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { Image as GeneratedImage } from "./elements/image";
import { useArtifact } from "@/hooks/use-artifact";

const ArtifactTrigger = ({ result }: { result: any }) => {
  if (!result) return null;

  // If result looks like an error object
  if (result && typeof result === "object" && "error" in result) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50">
        Error: {String((result as any).error)}
      </div>
    );
  }

  // No automatic document display - artifacts are now purely user-controlled via "Run Code"
  return null;
};
import { Response } from "./elements/response";
import type { HTMLAttributes } from "react";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { MessageVersionSwitcher } from "./message-version-switcher";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { LoaderIcon } from "./icons";

// MessageContent component (moved from elements/message.tsx)
export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
  // Note: do not use inline-flex here; it prevents w-full from expanding for assistant messages
  "flex flex-col gap-1 overflow-hidden rounded-lg text-foreground text-base min-w-0",
      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
      "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
      "is-user:dark",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
  userId,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  userId: string;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full max-w-full lg:max-w-3xl"
      data-role={message.role}
      data-testid={`message-${message.role}`}
      initial={{ opacity: 0 }}
    >
      <div
        className={cn("flex w-full items-start", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
        style={{
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden"
        }}
      >
        <div
          className={cn("flex flex-col w-full max-w-full", {
            "gap-1 md:gap-1": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            ),
            "min-h-96": message.role === "assistant" && requiresScrollPadding,
            "items-start overflow-hidden":
              message.role === "assistant" || mode === "edit",
            "items-end":
              message.role === "user" && mode !== "edit",
          })}
          style={{
            minWidth: 0,
            maxWidth: "100%",
            width: "100%",
            overflow: "hidden",
            contain: "layout"
          }}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className={cn("flex flex-row gap-2", {
                "justify-end": message.role === "user",
                "justify-start": message.role === "assistant",
              })}
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === "reasoning" && part.text?.trim().length > 0) {
              return (
                <MessageReasoning
                  isLoading={isLoading}
                  key={key}
                  reasoning={part.text}
                />
              );
            }

            if (type === "text") {
              if (mode === "view") {
                return (
                  <div
                    className={cn("flex w-full", {
                      "justify-end": message.role === "user",
                      "justify-start": message.role === "assistant",
                    })}
                    key={key}
                  >
          <MessageContent
                      className={cn({
            "user-bubble inline-block max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 text-left text-white break-normal hyphens-none whitespace-pre-wrap":
                          message.role === "user",
                        // Assistant spans the full chat width and uses internal content padding alignment similar to input
                        "w-full min-w-0 bg-transparent px-0 py-0 text-left max-w-none overflow-hidden wrap-break-word overflow-wrap-anywhere":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                      style={
                        message.role === "user"
                          ? { backgroundColor: "#006cff" }
                          : undefined
                      }
                    >
                      {message.role === "assistant" && isLoading && !(part.text && part.text.trim()) ? (
                        <div className="flex flex-row items-center gap-2 text-muted-foreground text-sm">
                          <div className="animate-spin"><LoaderIcon /></div>
                          <div>Thinking...</div>
                        </div>
                      ) : (
                        <Response>{sanitizeText(part.text)}</Response>
                      )}
                    </MessageContent>
                  </div>
                );
              }

              if (mode === "edit") {
                return (
                  <div
                    className="flex w-full flex-row items-start gap-3"
                    key={key}
                  >
                    <div className="size-8" />
                    <div className="min-w-0 flex-1">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        setMode={setMode}
                        chatId={chatId}
                        userId={userId}
                      />
                    </div>
                  </div>
                );
              }
            }

            // Inline generated image rendering (tool output)
            const partAny: any = part as any;
            if (partAny && partAny.type === "image") {
              const mediaType = partAny.mediaType || "image/png";
              const base64 = typeof partAny.image === "string" ? partAny.image : undefined;
              if (!base64) return null;

              // Lightbox state scoped to this image part
              const [open, setOpen] = useState(false);
              const [isLoaded, setIsLoaded] = useState(false);

              // Copy and download helpers
              const dataUrl = `data:${mediaType};base64,${base64}`;
              const handleCopy = async () => {
                try {
                  // Prefer ClipboardItem when available
                  if (typeof window !== "undefined" && (window as any).ClipboardItem) {
                    const blob = await (await fetch(dataUrl)).blob();
                    const ClipboardItemCtor = (window as any).ClipboardItem;
                    await navigator.clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })]);
                  } else {
                    await navigator.clipboard.writeText(dataUrl);
                  }
                } catch (e) {
                  try {
                    await navigator.clipboard.writeText(dataUrl);
                  } catch {}
                }
              };
              const handleDownload = () => {
                try {
                  const a = document.createElement("a");
                  a.href = dataUrl;
                  a.download = `image-${message.id}.png`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                } catch {}
              };

              return (
                <div
                  className={cn("flex w-full", {
                    "justify-end": message.role === "user",
                    "justify-start": message.role === "assistant",
                  })}
                  key={key}
                >
                  <div
                    className={cn(
                      "relative group max-w-[280px] md:max-w-[360px] rounded-lg overflow-hidden border bg-card",
                      { "user-bubble inline-block p-1": message.role === "user" }
                    )}
                  >
                    <button
                      type="button"
                      aria-label="Open image"
                      className="block focus:outline-none"
                      onClick={() => setOpen(true)}
                    >
                      {/* biome-ignore lint/performance/noImgElement: runtime base64 image */}
                      <img
                        alt="Generated image"
                        className={cn("h-auto w-full object-cover transition-opacity duration-150", {
                          "opacity-0": !isLoaded,
                          "opacity-100": isLoaded,
                        })}
                        src={dataUrl}
                        onLoad={() => setIsLoaded(true)}
                      />
                    </button>

                    {/* Image loading placeholder to avoid blank gap */}
                    {!isLoaded && (
                      <div className="absolute inset-0 grid place-items-center bg-muted/40">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <div className="animate-spin"><LoaderIcon /></div>
                          <span>Loading image…</span>
                        </div>
                      </div>
                    )}

                    {/* Overlay actions top-right */}
                    <div className="pointer-events-none absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-1 shadow-md backdrop-blur-md">
                        <button
                          type="button"
                          className="text-xs hover:underline"
                          onClick={handleDownload}
                          aria-label="Download image"
                        >
                          Download
                        </button>
                        <span className="text-muted-foreground/60">|</span>
                        <button
                          type="button"
                          className="text-xs hover:underline"
                          onClick={handleCopy}
                          aria-label="Copy image"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Simple lightbox */}
                    {open && (
                      <div
                        className="fixed inset-0 z-50 bg-black/80 p-4 md:p-8 flex items-center justify-center"
                        onClick={() => setOpen(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Image preview"
                      >
                        <div className="relative max-h-full max-w-full">
                          {/* biome-ignore lint/performance/noImgElement: base64 preview */}
                          <img
                            alt="Generated image preview"
                            className="max-h-[85vh] max-w-[95vw] rounded-lg shadow-2xl"
                            src={dataUrl}
                          />
                          <div className="absolute right-2 top-2 inline-flex items-center gap-2 rounded-md bg-background/80 px-2 py-1 shadow-md backdrop-blur-md">
                            <button type="button" className="text-xs hover:underline" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>Download</button>
                            <span className="text-muted-foreground/60">|</span>
                            <button type="button" className="text-xs hover:underline" onClick={(e) => { e.stopPropagation(); handleCopy(); }}>Copy</button>
                            <span className="text-muted-foreground/60">|</span>
                            <button type="button" className="text-xs hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>Close</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (type === "tool-getWeather") {
              const { toolCallId, state } = part;

              return (
                <Tool defaultOpen={true} key={toolCallId}>
                  <ToolHeader state={state} type="tool-getWeather" />
                  <ToolContent>
                    {state === "input-available" && (
                      <ToolInput input={part.input} />
                    )}
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={undefined}
                        output={<Weather weatherAtLocation={part.output} />}
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            if (type === "tool-createDocument") {
              const { toolCallId } = part;

              if (part.output && "error" in part.output) {
                return (
                  <div
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
                    key={toolCallId}
                  >
                    Error creating document: {String(part.output.error)}
                  </div>
                );
              }

              return (
                <ArtifactTrigger
                  key={toolCallId}
                  result={part.output}
                />
              );
            }

            if (type === "tool-updateDocument") {
              const { toolCallId } = part;

              if (part.output && "error" in part.output) {
                return (
                  <div
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
                    key={toolCallId}
                  >
                    Error updating document: {String(part.output.error)}
                  </div>
                );
              }

              return (
                <ArtifactTrigger
                  key={toolCallId}
                  result={part.output}
                />
              );
            }

            if (type === "tool-requestSuggestions") {
              const { toolCallId, state } = part;

              return (
                <Tool defaultOpen={true} key={toolCallId}>
                  <ToolHeader state={state} type="tool-requestSuggestions" />
                  <ToolContent>
                    {state === "input-available" && (
                      <ToolInput input={part.input} />
                    )}
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={undefined}
                        output={
                          "error" in part.output ? (
                            <div className="rounded border p-2 text-red-500">
                              Error: {String(part.output.error)}
                            </div>
                          ) : (
                            <DocumentToolResult
                              isReadonly={isReadonly}
                              result={part.output}
                              type="request-suggestions"
                            />
                          )
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            return null;
          })}

          {/* Fallback placeholder when assistant has no parts yet */}
          {message.role === "assistant" && isLoading && (!message.parts || message.parts.length === 0) && (
            <div className="flex flex-row items-center gap-2 text-muted-foreground text-sm">
              <div className="animate-spin"><LoaderIcon /></div>
              <div>Thinking...</div>
            </div>
          )}

          {!isReadonly && (
            <>
              <MessageActions
                chatId={chatId}
                isLoading={isLoading}
                key={`action-${message.id}`}
                message={message}
                setMode={setMode}
                vote={vote}
                rightSlot={message.role === "user" ? (
                  <MessageVersionSwitcher
                    key={`version-${message.id}`}
                    message={message}
                    onVersionSwitch={(newContent) => {
                      setMessages(prevMessages =>
                        prevMessages.map(m =>
                          m.id === message.id
                            ? { ...m, parts: newContent }
                            : m
                        )
                      );
                    }}
                    onAssistantSwitch={(assistant) => {
                      if (!assistant) return;
                      setMessages(prev => {
                        const idx = prev.findIndex((m) => m.id === message.id);
                        if (idx === -1) return prev;
                        // Build a cleaned list without other occurrences of this assistant id
                        const cleaned = prev.filter((m, j) => {
                          if (m.role !== "assistant") return true;
                          // Keep the assistant at the intended position (userIdx+1); drop others with same id
                          if (m.id === assistant.id && j !== idx + 1) return false;
                          return true;
                        });

                        const next = [...cleaned];
                        const following = next[idx + 1];

                        if (following && following.role === "assistant") {
                          next[idx + 1] = {
                            ...following,
                            id: assistant.id,
                            parts: assistant.parts,
                            role: "assistant",
                          } as any;
                        } else {
                          // Insert assistant right after the user message
                          next.splice(idx + 1, 0, {
                            id: assistant.id,
                            role: "assistant",
                            parts: assistant.parts,
                            metadata: assistant.metadata || following?.metadata,
                          } as any);
                        }

                        return next;
                      });
                    }}
                    onRegenerateAfterSwitch={() => {
                      regenerate();
                    }}
                  />
                ) : undefined}
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }

    return false;
  }
);

export const ThinkingMessage = ({ variant = "text" }: { variant?: "text" | "image" }) => {
  const role = "assistant";

  if (variant === "image") {
    return (
      <motion.div
        animate={{ opacity: 1 }}
        className="group/message w-full"
        data-role={role}
        data-testid="message-assistant-loading-image"
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-start justify-start">
          <div className="flex w-full flex-col gap-2">
            <div className="flex flex-row items-center gap-3 text-muted-foreground text-sm">
              <div className="animate-spin"><LoaderIcon /></div>
              <div>Generating Image...</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
};
