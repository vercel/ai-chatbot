"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
  CodeIcon,
  DownloadIcon,
  FileIcon,
  TerminalIcon,
} from "lucide-react";
import { useState } from "react";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { Badge } from "./ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { SparklesIcon as SparklesIconCustom } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIconCustom size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            ),
            "w-full":
              (message.role === "assistant" &&
                (message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim()
                ) ||
                  message.parts?.some((p) => p.type.startsWith("tool-")))) ||
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

            if (type === "reasoning") {
              const hasContent = part.text?.trim().length > 0;
              const isStreaming = "state" in part && part.state === "streaming";
              if (hasContent || isStreaming) {
                return (
                  <MessageReasoning
                    isLoading={isLoading || isStreaming}
                    key={key}
                    reasoning={part.text || ""}
                  />
                );
              }
            }

            if (type === "text") {
              if (mode === "view") {
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        "wrap-break-word w-fit rounded-2xl px-3 py-2 text-right text-white":
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
              const approvalId = (part as { approval?: { id: string } })
                .approval?.id;
              const isDenied =
                state === "output-denied" ||
                (state === "approval-responded" &&
                  (part as { approval?: { approved?: boolean } }).approval
                    ?.approved === false);
              const widthClass = "w-[min(100%,450px)]";

              if (state === "output-available") {
                return (
                  <div className={widthClass} key={toolCallId}>
                    <Weather weatherAtLocation={part.output} />
                  </div>
                );
              }

              if (isDenied) {
                return (
                  <div className={widthClass} key={toolCallId}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader
                        state="output-denied"
                        type="tool-getWeather"
                      />
                      <ToolContent>
                        <div className="px-4 py-3 text-muted-foreground text-sm">
                          Weather lookup was denied.
                        </div>
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              if (state === "approval-responded") {
                return (
                  <div className={widthClass} key={toolCallId}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader state={state} type="tool-getWeather" />
                      <ToolContent>
                        <ToolInput input={part.input} />
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              return (
                <div className={widthClass} key={toolCallId}>
                  <Tool className="w-full" defaultOpen={true}>
                    <ToolHeader state={state} type="tool-getWeather" />
                    <ToolContent>
                      {(state === "input-available" ||
                        state === "approval-requested") && (
                        <ToolInput input={part.input} />
                      )}
                      {state === "approval-requested" && approvalId && (
                        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                          <button
                            className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: approvalId,
                                approved: false,
                                reason: "User denied weather lookup",
                              });
                            }}
                            type="button"
                          >
                            Deny
                          </button>
                          <button
                            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: approvalId,
                                approved: true,
                              });
                            }}
                            type="button"
                          >
                            Allow
                          </button>
                        </div>
                      )}
                    </ToolContent>
                  </Tool>
                </div>
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
                <DocumentPreview
                  isReadonly={isReadonly}
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
                <div className="relative" key={toolCallId}>
                  <DocumentPreview
                    args={{ ...part.output, isUpdate: true }}
                    isReadonly={isReadonly}
                    result={part.output}
                  />
                </div>
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

            // Bluebag Bash Tool
            if (type === "tool-bluebag_bash") {
              const { toolCallId, state } = part;
              const input = part.input;
              const output = "output" in part ? part.output : undefined;

              return (
                <Collapsible
                  className="not-prose w-full overflow-hidden rounded-lg border border-border bg-card"
                  defaultOpen={true}
                  key={toolCallId}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-zinc-900 text-zinc-100 dark:bg-zinc-800">
                        <TerminalIcon className="size-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          Terminal Command
                        </span>
                        {input?.command && (
                          <code className="max-w-[300px] truncate font-mono text-muted-foreground text-xs">
                            {input.command}
                          </code>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {state === "output-available" && output && (
                        <Badge
                          className={cn(
                            "text-xs",
                            output.exitCode === 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                          variant="secondary"
                        >
                          {output.exitCode === 0 ? "Success" : "Failed"}
                        </Badge>
                      )}
                      {(state === "input-available" ||
                        state === "input-streaming") && (
                        <Badge
                          className="animate-pulse text-xs"
                          variant="secondary"
                        >
                          Running...
                        </Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border bg-zinc-950 p-4 font-mono text-sm">
                      {input?.command && (
                        <div className="mb-3 flex items-center gap-2 text-zinc-400">
                          <span className="text-green-400">$</span>
                          <span className="text-zinc-100">{input.command}</span>
                        </div>
                      )}
                      {state === "output-available" && output?.result && (
                        <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap text-zinc-300">
                          {output.result}
                        </pre>
                      )}
                      {output?.artifacts && output.artifacts.length > 0 && (
                        <div className="mt-3 border-t border-zinc-800 pt-3">
                          <span className="text-zinc-500 text-xs">
                            Created files:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {output.artifacts.map((artifact) => (
                              <Badge
                                className="font-mono text-xs"
                                key={artifact.fileId}
                                variant="outline"
                              >
                                {artifact.filename}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // Bluebag Code Execution Tool
            if (type === "tool-bluebag_code_execution") {
              const { toolCallId, state } = part;
              const input = part.input;
              const output = "output" in part ? part.output : undefined;

              const languageLabel =
                input?.language === "python"
                  ? "Python"
                  : input?.language === "javascript"
                    ? "JavaScript"
                    : input?.language === "typescript"
                      ? "TypeScript"
                      : "Code";

              return (
                <Collapsible
                  className="not-prose w-full overflow-hidden rounded-lg border border-border bg-card"
                  defaultOpen={true}
                  key={toolCallId}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <CodeIcon className="size-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          {languageLabel} Execution
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Running code in sandbox
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {state === "output-available" && output && (
                        <Badge
                          className={cn(
                            "text-xs",
                            output.exitCode === 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                          variant="secondary"
                        >
                          {output.exitCode === 0 ? "Success" : "Error"}
                        </Badge>
                      )}
                      {(state === "input-available" ||
                        state === "input-streaming") && (
                        <Badge
                          className="animate-pulse text-xs"
                          variant="secondary"
                        >
                          Executing...
                        </Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border">
                      {input?.code && (
                        <div className="bg-zinc-950 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium text-zinc-500 text-xs uppercase tracking-wide">
                              Code
                            </span>
                            <Badge className="text-xs" variant="outline">
                              {languageLabel}
                            </Badge>
                          </div>
                          <pre className="max-h-[200px] overflow-auto font-mono text-sm text-zinc-100">
                            <code>{input.code}</code>
                          </pre>
                        </div>
                      )}
                      {state === "output-available" && output?.result && (
                        <div className="border-t border-zinc-800 bg-zinc-900/50 p-4">
                          <span className="mb-2 block font-medium text-zinc-500 text-xs uppercase tracking-wide">
                            Output
                          </span>
                          <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap font-mono text-sm text-zinc-300">
                            {output.result}
                          </pre>
                        </div>
                      )}
                      {output?.artifacts && output.artifacts.length > 0 && (
                        <div className="border-t border-border bg-muted/30 p-3">
                          <span className="text-muted-foreground text-xs">
                            Generated files:
                          </span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {output.artifacts.map((artifact) => (
                              <div
                                className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1"
                                key={artifact.fileId}
                              >
                                <FileIcon className="size-3 text-muted-foreground" />
                                <span className="font-mono text-xs">
                                  {artifact.filename}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // Bluebag Text Editor Tool
            if (type === "tool-bluebag_text_editor") {
              const { toolCallId, state } = part;
              const input = part.input;
              const output = "output" in part ? part.output : undefined;

              const commandLabels: Record<string, string> = {
                view: "Viewing file",
                create: "Creating file",
                str_replace: "Editing file",
                insert: "Inserting into file",
              };

              const commandLabel = input?.command
                ? commandLabels[input.command] ?? "File operation"
                : "File operation";

              return (
                <Collapsible
                  className="not-prose w-full overflow-hidden rounded-lg border border-border bg-card"
                  defaultOpen={true}
                  key={toolCallId}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <FileIcon className="size-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          {commandLabel}
                        </span>
                        {input?.path && (
                          <code className="max-w-[300px] truncate font-mono text-muted-foreground text-xs">
                            {input.path}
                          </code>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {state === "output-available" && (
                        <Badge
                          className={cn(
                            "text-xs",
                            output?.error
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}
                          variant="secondary"
                        >
                          {output?.error ? "Error" : "Done"}
                        </Badge>
                      )}
                      {(state === "input-available" ||
                        state === "input-streaming") && (
                        <Badge
                          className="animate-pulse text-xs"
                          variant="secondary"
                        >
                          Processing...
                        </Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border">
                      {input?.command === "str_replace" &&
                        input.old_str &&
                        input.new_str && (
                          <div className="space-y-3 p-4">
                            <div>
                              <span className="mb-1 block font-medium text-red-500 text-xs">
                                - Removed
                              </span>
                              <pre className="max-h-[150px] overflow-auto rounded-md bg-red-50 p-2 font-mono text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">
                                {input.old_str}
                              </pre>
                            </div>
                            <div>
                              <span className="mb-1 block font-medium text-green-500 text-xs">
                                + Added
                              </span>
                              <pre className="max-h-[150px] overflow-auto rounded-md bg-green-50 p-2 font-mono text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
                                {input.new_str}
                              </pre>
                            </div>
                          </div>
                        )}
                      {input?.command === "create" && input.file_text && (
                        <div className="p-4">
                          <span className="mb-2 block font-medium text-muted-foreground text-xs uppercase tracking-wide">
                            File Content
                          </span>
                          <pre className="max-h-[200px] overflow-auto rounded-md bg-zinc-950 p-3 font-mono text-sm text-zinc-100">
                            {input.file_text}
                          </pre>
                        </div>
                      )}
                      {state === "output-available" &&
                        output?.result &&
                        input?.command === "view" && (
                          <div className="p-4">
                            <pre className="max-h-[300px] overflow-auto rounded-md bg-zinc-950 p-3 font-mono text-sm text-zinc-100">
                              {output.result}
                            </pre>
                          </div>
                        )}
                      {output?.error && (
                        <div className="p-4">
                          <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm dark:bg-red-950/30 dark:text-red-300">
                            {output.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // Bluebag File Download URL Tool
            if (type === "tool-bluebag_file_download_url") {
              const { toolCallId, state } = part;
              const input = part.input;
              const output = "output" in part ? part.output : undefined;

              return (
                <div
                  className="not-prose w-full overflow-hidden rounded-lg border border-border bg-card"
                  key={toolCallId}
                >
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <DownloadIcon className="size-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          File Download
                        </span>
                        {input?.fileId && (
                          <code className="font-mono text-muted-foreground text-xs">
                            {input.fileId}
                          </code>
                        )}
                      </div>
                    </div>
                    {state === "output-available" && output?.downloadUrl && (
                      <a
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                        download
                        href={output.downloadUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <DownloadIcon className="size-4" />
                        Download
                      </a>
                    )}
                    {(state === "input-available" ||
                      state === "input-streaming") && (
                      <Badge
                        className="animate-pulse text-xs"
                        variant="secondary"
                      >
                        Generating link...
                      </Badge>
                    )}
                  </div>
                  {output?.expiresAt && (
                    <div className="border-t border-border bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground text-xs">
                        Link expires:{" "}
                        {new Date(output.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}

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
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIconCustom size={14} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
