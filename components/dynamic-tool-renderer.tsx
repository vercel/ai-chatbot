"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatMessage } from "@/lib/types";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";

type DynamicToolPartType = "dynamic-tool-call" | "dynamic-tool-result";

type DynamicToolPart = {
  type: DynamicToolPartType;
  toolCallId: string;
  toolName: string;
  state:
    | "input-available"
    | "output-available"
    | "approval-requested"
    | "approval-responded"
    | "output-denied";
  input?: any;
  output?: any;
  approval?: {
    id: string;
    approved?: boolean;
  };
};

type DynamicToolRendererProps = {
  part: DynamicToolPart;
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
};

export function DynamicToolRenderer({
  part,
  addToolApprovalResponse,
}: DynamicToolRendererProps) {
  const { toolCallId, toolName, state } = part;
  const approvalId = part.approval?.id;
  const isDenied =
    state === "output-denied" ||
    (state === "approval-responded" && part.approval?.approved === false);

  // Format tool name for display
  const displayName = toolName.replace(/:/g, " › ");

  if (isDenied) {
    return (
      <Tool className="w-full" defaultOpen={true}>
        <ToolHeader state="output-denied" type={toolName as any} />
        <ToolContent>
          <div className="px-4 py-3 text-muted-foreground text-sm">
            Tool execution was denied.
          </div>
        </ToolContent>
      </Tool>
    );
  }

  if (state === "output-available") {
    return (
      <Tool className="w-full" defaultOpen={true}>
        <ToolHeader state={state} type={toolName as any} />
        <ToolContent>
          {part.input && <ToolInput input={part.input} />}
          {part.output && (
            <ToolOutput
              errorText={
                typeof part.output === "object" && "error" in part.output
                  ? String(part.output.error)
                  : undefined
              }
              output={
                <div className="overflow-auto">
                  <pre className="whitespace-pre-wrap break-words rounded bg-muted p-3 font-mono text-xs">
                    {JSON.stringify(part.output, null, 2)}
                  </pre>
                </div>
              }
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  if (state === "approval-responded") {
    return (
      <Tool className="w-full" defaultOpen={true}>
        <ToolHeader state={state} type={toolName as any} />
        <ToolContent>
          <ToolInput input={part.input} />
        </ToolContent>
      </Tool>
    );
  }

  // input-available or approval-requested
  return (
    <Tool className="w-full" defaultOpen={true}>
      <ToolHeader state={state} type={toolName as any} />
      <ToolContent>
        {(state === "input-available" || state === "approval-requested") && (
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
                  reason: `User denied ${displayName}`,
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
  );
}
