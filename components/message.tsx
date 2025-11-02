"use client";
import type { useChat } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import { memo, useMemo, useState } from "react";
import type { ChatMessage, Vote } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import type { ArtifactKind } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "./elements/source";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

type UseChatReturnType = ReturnType<typeof useChat<ChatMessage>>;

type SourceItem = {
  href: string;
  title: string;
};

const extractSourcesFromMessage = (message: ChatMessage): SourceItem[] => {
  const uniqueSources = new Map<string, string | undefined>();

  const addSource = (href?: string | null, title?: string | null) => {
    if (!href) {
      return;
    }

    const trimmedHref = href.trim();
    if (!trimmedHref) {
      return;
    }

    const existingTitle = uniqueSources.get(trimmedHref);
    const normalizedTitle = title?.trim();

    if (!uniqueSources.has(trimmedHref)) {
      uniqueSources.set(trimmedHref, normalizedTitle);
      return;
    }

    if (!existingTitle && normalizedTitle) {
      uniqueSources.set(trimmedHref, normalizedTitle);
    }
  };

  for (const part of message.parts ?? []) {
    if (part.type === "source-url") {
      addSource(part.url, part.title);
      continue;
    }

    if (part.type === "data-sources") {
      const sources = Array.isArray(part.data) ? part.data : [];
      for (const source of sources) {
        if (typeof source === "string") {
          addSource(source);
        }
      }
      continue;
    }

    if (
      part.type === "dynamic-tool" &&
      part.toolName === "google_search" &&
      part.state === "output-available"
    ) {
      const results = Array.isArray((part.output as any)?.results)
        ? (part.output as any).results
        : [];
      for (const result of results) {
        if (typeof result?.url === "string") {
          addSource(result.url, result?.title);
        }
      }
      continue;
    }

    if (
      part.type === "dynamic-tool" &&
      part.toolName === "url_context" &&
      part.state === "output-available"
    ) {
      const output = (part.output ?? {}) as Record<string, unknown>;
      const candidates: unknown[] = [];

      if (Array.isArray((output as any).summaries)) {
        candidates.push(...((output as any).summaries as unknown[]));
      }

      if (Array.isArray((output as any).entries)) {
        candidates.push(...((output as any).entries as unknown[]));
      }

      if (Array.isArray((output as any).results)) {
        candidates.push(...((output as any).results as unknown[]));
      }

      for (const entry of candidates) {
        if (entry && typeof (entry as any).url === "string") {
          addSource(
            (entry as any).url,
            typeof (entry as any).title === "string"
              ? ((entry as any).title as string)
              : undefined
          );
        }
      }
    }
  }

  const messageSources = (message as { sources?: unknown }).sources;
  if (Array.isArray(messageSources)) {
    for (const source of messageSources) {
      if (typeof source === "string") {
        addSource(source);
      }
    }
  }

  // Provider metadata may be available at runtime but not in types
  const messageWithMetadata = message as ChatMessage & {
    experimental_providerMetadata?: {
      google?: unknown;
    };
  };
  const googleMetadata = messageWithMetadata.experimental_providerMetadata
    ?.google as
    | {
        groundingMetadata?: {
          groundingChunks?: Array<{
            web?: { uri?: string | null; title?: string | null } | null;
            retrievedContext?: {
              uri?: string | null;
              title?: string | null;
            } | null;
          }>;
        };
        urlContextMetadata?: {
          urlMetadata?: Array<{
            retrievedUrl?: string | null;
            title?: string | null;
          }>;
        };
      }
    | undefined;

  const groundingChunks =
    googleMetadata?.groundingMetadata?.groundingChunks ?? [];
  for (const chunk of groundingChunks) {
    addSource(chunk.web?.uri ?? undefined, chunk.web?.title ?? undefined);
    addSource(
      chunk.retrievedContext?.uri ?? undefined,
      chunk.retrievedContext?.title ?? undefined
    );
  }

  const urlMetadata = googleMetadata?.urlContextMetadata?.urlMetadata ?? [];
  for (const metadata of urlMetadata) {
    addSource(metadata.retrievedUrl ?? undefined, metadata.title ?? undefined);
  }

  const sources: SourceItem[] = [];
  for (const [href, title] of uniqueSources.entries()) {
    let resolvedTitle = title;

    if (!resolvedTitle) {
      try {
        resolvedTitle = new URL(href).hostname;
      } catch {
        resolvedTitle = href;
      }
    }

    sources.push({ href, title: resolvedTitle });
  }

  return sources;
};

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatReturnType["setMessages"];
  regenerate: UseChatReturnType["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part: ChatMessage["parts"][number]) => part.type === "file"
  );

  useDataStream();

  const sources = useMemo(() => extractSourcesFromMessage(message), [message]);

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full"
      data-role={message.role}
      data-testid={`message-${message.role}`}
      initial={{ opacity: 0 }}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p: ChatMessage["parts"][number]) =>
                p.type === "text" && p.text?.trim()
            ),
            "min-h-96": message.role === "assistant" && requiresScrollPadding,
            "w-full":
              (message.role === "assistant" &&
                message.parts?.some(
                  (p: ChatMessage["parts"][number]) =>
                    p.type === "text" && p.text?.trim()
                )) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map(
                (
                  attachment: ChatMessage["parts"][number] & { type: "file" }
                ) => (
                  <PreviewAttachment
                    attachment={{
                      name: attachment.filename ?? "file",
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                    key={attachment.url}
                  />
                )
              )}
            </div>
          )}

          {message.parts?.map(
            (part: ChatMessage["parts"][number], index: number) => {
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
                    <div key={key}>
                      <MessageContent
                        className={cn({
                          "w-fit break-words rounded-2xl px-3 py-2 text-right text-white":
                            message.role === "user",
                          "bg-transparent px-0 py-0 text-left":
                            message.role === "assistant",
                        })}
                        data-testid="message-content"
                        style={
                          message.role === "user"
                            ? { backgroundColor: "#006cff" }
                            : undefined
                        }
                      >
                        <Response>{sanitizeText(part.text)}</Response>
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
                        />
                      </div>
                    </div>
                  );
                }
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
                          output={
                            <Weather weatherAtLocation={part.output as any} />
                          }
                        />
                      )}
                    </ToolContent>
                  </Tool>
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
                            "error" in (part.output as any) ? (
                              <div className="rounded border p-2 text-red-500">
                                Error: {String((part.output as any).error)}
                              </div>
                            ) : (
                              <DocumentToolResult
                                isReadonly={isReadonly}
                                result={
                                  part.output as any as unknown as {
                                    id: string;
                                    title: string;
                                    kind: ArtifactKind;
                                  }
                                }
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
            }
          )}

          {/* Display sources for assistant messages with web/news search */}
          {message.role === "assistant" && sources.length > 0 && (
            <div className="mt-4">
              <Sources>
                <SourcesTrigger count={sources.length} />
                <SourcesContent>
                  {sources.map((source) => (
                    <Source
                      href={source.href}
                      key={source.href}
                      title={source.title}
                    />
                  ))}
                </SourcesContent>
              </Sources>
            </div>
          )}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
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

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full"
      data-role={role}
      data-testid="message-assistant-loading"
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="p-0 text-muted-foreground text-sm">Thinking...</div>
        </div>
      </div>
    </motion.div>
  );
};
