## Message rendering (legacy approach in `components/message.tsx`)

This captures the previous design so we can reintroduce pieces later after adopting upstream AI Elements `Tool` components.

### Goals

- Group model reasoning and tool calls into a single, chronological, collapsible block.
- Preserve message part order (attachments, text before/after tools, etc.).
- Support custom tools not present upstream (Slack, Gmail, Calendar, Transcripts, Mem0).
- Render document-related tools inline (`DocumentPreview`, `DocumentToolResult`).

### Core idea

- Scan `message.parts` and split into:
  - `reasoningAndToolParts`: parts where `type === 'reasoning' && text.trim()`, or `type` is a tool
  - `otherParts`: everything else with original index
- Build `mergedParts`:
  - All `otherParts` before the first reasoning/tool
  - A single synthetic `reasoning` part containing `_toolChildren = reasoningAndToolParts`
  - All `otherParts` after the first reasoning/tool

Pseudo:

```ts
const parts = message.parts ?? [];

const isToolType = (t?: string) =>
  !!t &&
  (t.startsWith("tool-") ||
    t === "tool-getWeather" ||
    t === "tool-createDocument" ||
    t === "tool-updateDocument" ||
    t === "tool-requestSuggestions");

const reasoningAndToolParts: any[] = [];
const otherParts: Array<{ part: any; originalIndex: number }> = [];
let firstIndex: number | null = null;

parts.forEach((p, i) => {
  const isReasoning =
    p?.type === "reasoning" &&
    typeof p?.text === "string" &&
    p.text.trim().length > 0;
  const isTool = isToolType(p?.type);
  if (isReasoning || isTool) {
    if (firstIndex === null) firstIndex = i;
    reasoningAndToolParts.push(p);
  } else {
    otherParts.push({ part: p, originalIndex: i });
  }
});

const mergedParts: any[] = [];

// before
otherParts
  .filter(
    ({ originalIndex }) => firstIndex === null || originalIndex < firstIndex
  )
  .forEach(({ part }) => mergedParts.push(part));

// unified block
if (reasoningAndToolParts.length > 0) {
  mergedParts.push({
    type: "reasoning",
    text: "",
    _toolChildren: reasoningAndToolParts,
  });
}

// after
otherParts
  .filter(
    ({ originalIndex }) => firstIndex !== null && originalIndex > firstIndex
  )
  .forEach(({ part }) => mergedParts.push(part));
```

### Rendering choices

- Text: previously used `Markdown`; now prefer `Response` element.
- Reasoning: we rendered a collapsible UI. Upstream provides `Reasoning` element. For a timeline UX, see `docs/timeline-view.md`.
- Tools:
  - Known tools: `tool-getWeather`, `tool-createDocument`, `tool-updateDocument`, `tool-requestSuggestions` render to `Weather`, `DocumentPreview`, `DocumentToolResult`.
  - Custom tools: routed through `ToolRenderer` → `UnifiedTool` using config maps (Gmail, Slack, Transcripts, Calendar, Mem0).
  - Error handling: when `output` has `{ error }`, show a small red error box.

### Migration notes (to upstream AI Elements Tool)

- Prefer upstream `Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput` for every `tool-*` part (`ToolUIPart`). See: https://ai-sdk.dev/elements/components/tool
- Keep text rendering with `MessageContent` + `Response`.
- Keep simple `MessageReasoning` by default; if we want the timeline, drop in the component from `docs/timeline-view.md`.
- For custom tools, either:
  - Make `ToolRenderer` return `Tool` wrappers with `ToolHeader/Content/Input/Output` (thin adapter), or
  - Render generically: if `type.startsWith('tool-')`, show parameters via `ToolInput` and output via `ToolOutput` (JSON or `Response`).

### Reintroduction checklist

- [ ] Swap `MessageReasoning` with timeline component (optional)
- [ ] Wrap custom tool results into `ToolOutput` inside `Tool`
- [ ] Replace any lingering `Markdown` usage with `Response`
- [ ] Avoid hard-coded tool lists; use `type.startsWith('tool-')`
