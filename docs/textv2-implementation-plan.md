# Plan: Implementing `textv2` Artifact with Tiptap

**Goal:** Create a new artifact type `textv2` that uses Tiptap for a rich text editing experience, co-existing with the current `text` artifact type.

**Analysis Summary:**

*   The current `text` artifact uses ProseMirror (`components/text-editor.tsx`).
*   Content is stored as Markdown string in `Document.content` (`text` type column).
*   Versioning happens by creating new rows in the `Document` table with the same `id` but different `createdAt`.
*   Diffing (`components/diffview.tsx`) uses ProseMirror's diffing capabilities after converting Markdown to HTML and then to ProseMirror documents.
*   Suggestions (`Suggestion` table, `@/lib/editor/suggestions`) are implemented as ProseMirror decorations.
*   The `Document.kind` column is an enum `['text', 'code', 'image', 'sheet']`.

**Key Context:**
- Supabase project: ai-chatbot (id: dvlcpljodhsfrucieoqd)
- Vercel project: ai-chatbot (ai.chrisyork.co, ai-chatbot-cyhq.vercel.app)
- TipTap app id: 7me322g9
- Tiptap CONVERT app id: v911g5l9
- Tiptap CONVERT JWT secret: XpEf51Uwc42DrGRFapTg2E3mEGOm1zYfZYvIikSRT9TeLXNU2M18mLCtSZ1HDF6t
- Use Supabase MCP tool to read/write tables, execute SQL, etc. 
  - Always check all relevant tables and columns before writing ANY code which refers to them.
- Use context7 MCP tool to get latest documentation for things like Supabase, Drizzle, NextJS, Vercel AI Chatbot SDK (NOT AI SDK), Clerk, TipTap, etc. 
  - ALWAYS ASSUME YOUR KNOWLEDGE IS OUT OF DATE AND YOU WILL BREAK CODE UNLESS YOU READ THE UP-TO-DATE DOCUMENTATION WITH THE CONTEXT7 MCP BEFORE ALL CODE CHANGES WITH THIRD-PARTY PACKAGES.
  - Key packages and context7 libraryNames. Pass these as strings to get-library-docs in context7 MCP tool. 
    - supabase/supabase
    - drizzle-team/drizzle-orm
    - clerk/clerk-docs
    - vercel/next.js
    - /ueberdosis/tiptap-docs
    - vercel/ai-chatbot (NEVER vercel-ai)
    - vercel/swr

**Implementation Steps:**

1.  **Database Migrations:**
    *   Add a new nullable column `content_json` of type `jsonb` to the `Document` table.
    *   Add `'textv2'` to the allowed enum values for the `Document.kind` column.

2.  **Create `textv2` Artifact Definition (`artifacts/textv2/client.tsx`):**
    *   Duplicate `artifacts/text/client.tsx`.
    *   Set `kind: 'textv2'`.
    *   Update description.
    *   Modify `onStreamPart` for `text-delta`: Parse incoming Markdown and update Tiptap editor state (JSON).
    *   Modify `content` function: Render a new `<TiptapEditor>` component instead of `<Editor>`. Pass JSON content and adapted props.
    *   Adapt/add `actions` and `toolbar` items relevant to rich text (e.g., formatting buttons).

3.  **Create Tiptap Editor Component (`components/tiptap-editor.tsx`):**
    *   Install Tiptap dependencies (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-markdown`, etc.).
    *   Use `useEditor` hook with desired Tiptap extensions (`StarterKit`, `Markdown`, `Placeholder`).
    *   Load initial content from `content_json` prop.
    *   Implement `onSaveContent` to save `editor.getJSON()` to the `content_json` database column.
    *   Handle streaming updates (parsing Markdown delta and updating editor state).
    *   Adapt suggestion plugin (`@/lib/editor/suggestions`) to work with Tiptap/React editor view.

4.  **Adapt Diff View (`components/diffview.tsx`):**
    *   Modify the component to accept an optional `kind` prop.
    *   If `kind === 'textv2'`, parse `oldContent`/`newContent` (expected to be JSON) directly into ProseMirror/Tiptap documents using the appropriate schema. Skip the `ReactMarkdown` -> HTML parsing step.
    *   The existing `diffEditor` function should work on the parsed documents.
    *   Render the diff using the same ProseMirror view approach.

5.  **Update Data Access Logic (Server Actions & Client Fetching):**
    *   Modify functions responsible for fetching/saving documents (`getDocument`, `saveDocument`, `getDocumentContentById`, etc.).
    *   Conditionally read/write `content_json` when `kind === 'textv2'`.
    *   Ensure `getDocumentContentById` returns JSON for `textv2` and string for `text`.

6.  **Integrate into UI:**
    *   Update artifact selection UI to include "Text (Rich)" (`textv2`).
    *   Ensure the main application logic renders the correct artifact component based on `Document.kind`.

7.  **Testing:**
    *   Test all aspects: creation, streaming, editing, saving, versioning, diffing, suggestions for `textv2`.
    *   Verify `text` artifacts remain unaffected.

**Open Questions/Considerations:**

*   **Streaming Performance:** How well does parsing Markdown deltas and updating Tiptap state perform? Investigate native Tiptap streaming/delta solutions if needed.
*   **Suggestion Plugin Adaptation:** Verify the feasibility of adapting the existing ProseMirror suggestion plugin or if using Tiptap's suggestion utility is better.
*   **Markdown vs. JSON:** Confirm that storing JSON is the desired approach for `textv2`. This offers more flexibility than Markdown.
*   **Diffing Complex Structures:** Ensure the diff view handles complex rich text structures (tables, embeds if added later) correctly.
*   **Streaming Format:** The current implementation uses `text-delta` stream parts (sending Markdown strings) which are then parsed client-side by the Tiptap editor. A final `final-content-json` delta is sent from the backend after saving to ensure the editor state matches the database JSON. Ideally, future improvements could involve the AI backend streaming Tiptap-compatible JSON deltas directly for better performance and accuracy during streaming, though this would require significant changes to the AI generation logic and the client-side stream handling in `artifacts/textv2/client.tsx`.
