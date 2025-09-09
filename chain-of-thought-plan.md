## Chain of Thought integration plan

### 1) Core requirement

- Combine model reasoning, tool activity/results, and intermediate thinking into a single, collapsible chain-of-thought block within each assistant message.
- Preserve message part order and keep normal message text/attachments outside this block.

### 2) Current architecture (what exists now)

- Rendering
  - `components/messages.tsx` maps `messages` → `components/message.tsx` `PreviewMessage`.
  - `components/message.tsx` renders `message.parts` in order. Reasoning uses `MessageReasoning` → `components/elements/reasoning.tsx` collapsible. Some tools are rendered ad hoc (`tool-getWeather`, `tool-createDocument`, etc.).
  - There is a generic tool system: `components/unified-tool.tsx` + `components/tool-configs.tsx` + `components/tool-renderer.tsx` (not yet wired into `message.tsx`).
- Streaming/data
  - Server: `app/(chat)/api/chat/route.ts` uses `createUIMessageStream` + `streamText(...).toUIMessageStream({ sendReasoning: true })`.
  - Client: `components/chat.tsx` uses `useChat`, pushes `onData` entries into `DataStreamProvider` for artifact side-channels.
  - Message type: `lib/types.ts` `ChatMessage` (UIMessage) with parts such as `reasoning`, and tool parts with `type` like `tool-<name>`, `state` of `'input-available' | 'output-available'`.
- New component installed
  - `components/ai-elements/chain-of-thought.tsx` exposing `ChainOfThought`, `ChainOfThoughtHeader`, `ChainOfThoughtContent`, `ChainOfThoughtStep`, `ChainOfThoughtSearchResults`, `ChainOfThoughtSearchResult`, `ChainOfThoughtImage`.
- Note
  - `docs/message-tsx-legacy-notes.md` describes a desired grouping: merge the first contiguous block of reasoning/tool parts into a single synthetic block between other parts. This matches our goal.

### 3) Candidate approaches

1. Minimal adapter in `message.tsx`
   - Detect first contiguous sequence of reasoning/tool parts. Render them inside a single `ChainOfThought` with steps. Use `ToolRenderer` for each tool step body. Keep all other parts unchanged.
2. Full replacement of existing reasoning/tool UI
   - Remove `MessageReasoning` and per-tool UI. Replace with only `ChainOfThought` for all reasoning and tool rendering. Larger change; more risk.
3. Pre-aggregation at data layer
   - Transform `message.parts` into one synthetic "chain_of_thought" part on the server or in a pre-render pass, then render a single component. More invasive and risks divergence from persisted parts.

### 4) Chosen approach: Minimal adapter (Approach 1)

- Rationale: Smallest change, leverages existing `ToolRenderer` and preserves current behaviors. Easy rollback. Clear mapping from parts → steps.

### 5) Data → UI mapping inside ChainOfThought

- Block placement
  - Build arrays: `beforeParts`, `cotParts`, `afterParts` where `cotParts` is the first contiguous run of parts that are reasoning or tools.
  - Render: `beforeParts`, then a single `ChainOfThought` block for `cotParts`, then `afterParts`.
- Header
  - `<ChainOfThought defaultOpen={isLoadingCurrentMessage}>`
  - `<ChainOfThoughtHeader>Chain of Thought</ChainOfThoughtHeader>`
- Reasoning parts
  - Each reasoning part becomes one `ChainOfThoughtStep` with `label="Thinking"`, `status` = `active` while `isLoading` else `complete`.
  - The text is placed inside a `<ChainOfThoughtContent>` block as a child of the CoT (not per-step) or inline under the reasoning step if we want tighter grouping. Start with inline under the reasoning step for clarity.
- Tool parts
  - For each tool part, derive `type` (e.g., `tool-searchTranscriptsByKeyword`).
  - Step label: use `ToolRenderer` config `getAction(toolType, state)`; description from `formatParameters(input, toolType)`.
  - Status: `active` when `state === 'input-available'`, `complete` when `state === 'output-available'`.
  - Step body: embed `<ToolRenderer ... />` so users can expand and see input/output details.
  - Search results: if tool is a search, optionally render `<ChainOfThoughtSearchResults>` badges summarizing results (using `getResultSummary` and/or a parsed count). Keep this additive and best-effort.
- Images
  - If model/tool yields image deltas in parts or via `CustomUIDataTypes.imageDelta`, we can render a `ChainOfThoughtImage` step with a caption. Ship later as a nice-to-have.

### 6) Gating and defaults

- Open/close behavior
  - Default open while the last assistant message is streaming; default closed otherwise.
- Visibility/model considerations
  - Honor existing app behavior (e.g., `ThinkingMessage` fallback and any model gating). We will not expose CoT when `selectedModelId === 'chat-model-reasoning'` gate says otherwise. Keep current conditions and replace the visual block only when we would have shown reasoning previously.

### 7) Edge cases

- No reasoning present → still show a CoT block if there are tool parts, otherwise omit.
- Unknown tool type → `ToolRenderer` falls back to null; in that case, render a generic step with JSON-stringified input/output.
- Tool error → rely on `UnifiedTool` error parsing and show error within the step body.

### 8) Implementation steps (edits)

1. Create `components/chain-of-thought-block.tsx`
   - Props: `{ message: ChatMessage; isLoading: boolean; isReadonly: boolean; }`
   - Implements the parts scan (reasoning/tool vs other) and renders a single CoT block for the first reasoning/tool run.
   - Uses `ChainOfThought`, `ChainOfThoughtHeader`, `ChainOfThoughtStep`, `ChainOfThoughtContent`, and `ToolRenderer`.
2. Wire into `components/message.tsx`
   - Replace current direct reasoning/tool rendering with `<ChainOfThoughtBlock ... />` where applicable.
   - Keep existing rendering for non-CoT parts (attachments, text, artifacts) unchanged.
3. Optional niceties
   - Add small badges for search result counts via `ChainOfThoughtSearchResults`.
   - Add image step later if `imageDelta` is surfaced as a message part.
4. QA sweep
   - Verify streaming updates: reasoning shows as active then completes; tool steps transition input → output.
   - Validate unknown tools and error surfaces.

### 9) Pseudocode for the parts scan

```ts
const parts = message.parts ?? [];
const isCoTPart = (p?: any) => {
  const t = p?.type as string | undefined;
  const isReasoning =
    t === "reasoning" &&
    typeof p?.text === "string" &&
    p.text.trim().length > 0;
  const isTool = !!t && t.startsWith("tool-");
  return isReasoning || isTool;
};

let firstIndex: number | null = null;
const cotParts: any[] = [];
const beforeParts: Array<{ part: any; index: number }> = [];
const afterParts: Array<{ part: any; index: number }> = [];

parts.forEach((p, i) => {
  if (isCoTPart(p)) {
    if (firstIndex === null) firstIndex = i;
    cotParts.push(p);
  } else {
    if (firstIndex === null) beforeParts.push({ part: p, index: i });
    else afterParts.push({ part: p, index: i });
  }
});
```

### 10) Acceptance criteria

- Assistant messages with reasoning/tool activity show a single CoT block with steps in original order.
- Reasoning auto-opens while streaming; collapses afterwards by default.
- Tool steps display concise action lines; details can be expanded via `UnifiedTool` body.
- Non-CoT parts (text, attachments, artifacts) render unchanged before/after the block.

### 11) Future improvements

- Richer search result rendering with clickable chips using `ChainOfThoughtSearchResult`.
- Image step rendering via `ChainOfThoughtImage` for vision flows.
- Feature flag to toggle CoT UI for A/B.

### 12) Optional Task component integration

- When is Task useful?

  - CoT visualizes the fine-grained sequence (thinking ↔ tools). Task can summarize these into human-readable milestones. Use it for a quick, high-level checklist rather than duplicating every micro-step.

- Approaches

  1. Conversation-turn summary (recommended minimal): After each assistant turn, render a single `Task` below the message summarizing key steps. No persistence beyond the message.
  2. Inline per-message Task: Embed a `Task` inside the CoT block, one item per reasoning/tool step. Risk of duplication vs. CoT; useful if users prefer a concise list over the detailed timeline.
  3. Multi-turn backlog: Persist tasks across turns (DB or message metadata). Highest complexity; skip initially.

- Chosen: 1) Conversation-turn summary

  - Simple, complements CoT without clutter. Default collapsed. Hidden if <2 items.

- Data mapping

  - Tool parts → `TaskItem` text: use `getAction(toolType, state)` and `formatParameters(...)` from `tool-configs`. Mark completed when `state === 'output-available'`.
  - Reasoning parts → brief `TaskItem` (e.g., "Analyze context" or first sentence). Collapse multiple reasoning steps.
  - Files (when applicable) → `TaskItem` containing `TaskItemFile` with inferred icon/name (e.g., document title/kind).

- Streaming behavior

  - Derive items from `message.parts` in `PreviewMessage` during render (no server changes). Update item statuses as parts stream in. Avoid coupling to artifact `DataStreamHandler`.

- Implementation steps (optional)

  1. Create `components/task-block.tsx` rendering:
     - `Task` (defaultOpen: isLoading), `TaskTrigger` (title e.g., "This turn: N steps"), `TaskContent` with `TaskItem`s built from parts.
  2. In `components/message.tsx`, conditionally render `TaskBlock` beneath the CoT block behind a flag (e.g., `SHOW_TASKS_SUMMARY`). Hide when <2 summarized steps.
  3. Add a lightweight setting/toggle later.

- Notes
  - Keep it KISS: do not replace CoT; Task is a summary. If redundancy feels high in testing, we can disable by default.
