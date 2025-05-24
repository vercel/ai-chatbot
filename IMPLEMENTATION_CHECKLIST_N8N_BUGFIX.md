# N8N Bugfix: `experimental_prepareRequestBody` Implementation Checklist

**Overall Goal:** Resolve the N8N bug where it responds to the wrong user message and to prevent duplicate N8N webhook invocations. This will be achieved by aligning client-side message sending and server-side message handling with the Vercel AI Chatbot template, primarily by using `experimental_prepareRequestBody` in `useChat` to send only the latest user message to the backend, and adjusting the backend to reconstruct message history. **Project-specific custom logic for associating new chats with a `documentId` at the point of creation will be deferred and restored in a later phase to simplify initial bugfix implementation.**

**Assistant Instructions for Executing this Checklist:**
*   Update the status emoji for each item **as you start it** (🟡) and **when you complete it successfully** (🟢).
*   If any step **fails or cannot be completed as described**, mark it with ⚠️ and **STOP IMMEDIATELY**. Do not proceed to the next step. Await further instructions from the user.
*   **CRITICAL FILE SEARCH PROTOCOL:** Before concluding any file doesn't exist, use `file_search` and `grep_search` tools to search the entire project. A complete Vercel project WILL have fundamental files. NEVER assume production projects lack basic files.
*   Perform **one checklist item at a time**.
*   All `curl` commands must be verified for correct file paths and syntax from the main Vercel AI Chatbot repository: `https://github.com/vercel/ai-chatbot`.
*   All Context7 MCP tool calls for documentation must use the precise library IDs specified in `project-rules`.

**Legend:**
*   🔴 Not Started
*   🟡 Started
*   🟢 Completed
*   ⚠️ Failed - STOPPED

---
## Phase 0: Pre-computation & Final Plan Approval (YOU ARE HERE)
---

1.  🟢 **User Confirmation:** User to confirm they have a backup/commit of `components/chat.tsx`, `app/(chat)/api/chat/route.ts`, and `app/(chat)/api/chat/schema.ts` (if it exists) before live edits begin.
    *   *Assistant Note: COMPLETED - Backup commit f3b8858 created with all current files.*
2.  🟢 **Final Checklist Review (User):** User to review this entire checklist for completeness, correctness, and adherence to instructions.
    *   *Assistant Note: COMPLETED - User approved the checklist for implementation.*

---
## ✅ Phase 1: Client-Side Changes in `components/chat.tsx` - COMPLETED (Scope: Template Alignment for Message Sending)
---

**Phase 1 Summary (Scope: Template Alignment for Message Sending):**
- ✅ Analyzed current vs. template implementation patterns for message sending.
- ✅ Removed complex `handleSubmitIntercept` function (109 lines).
- ✅ Implemented `experimental_prepareRequestBody` directly in `useChat` options to send only the latest `message` object and standard fields (chatId, selectedChatModel, selectedVisibilityType), as per Vercel template. **Custom `documentId` is NOT included in this payload for this phase.**
- ✅ Created simple `handleFormSubmit` wrapper for N8N state management.
- ✅ Preserved all existing N8N logic (SWR polling, state management, etc.).
- ✅ Updated MultimodalInput and Artifact props.
- ✅ Verified TypeScript compilation with no errors.

**Next: Phase 2 - Server-Side Schema (Scope: Template Alignment for Request Validation)**

---
## ✅ Phase 2: Server-Side Schema `app/(chat)/api/chat/schema.ts` - COMPLETED (Scope: Template Alignment for Request Validation)
---

**Phase 2 Summary (Scope: Template Alignment for Request Validation):**
- ✅ Fetched latest Vercel template API validation schema (`app/(chat)/api/chat/schema.ts`).
- ✅ Discovered project was missing `app/(chat)/api/chat/schema.ts` (API validation).
- ✅ Confirmed project has `lib/db/schema.ts` (database schema, which includes project-specific `Document.chatId` field - this will be relevant in a later phase).
- ✅ Created missing API validation schema `app/(chat)/api/chat/schema.ts` based *strictly* on Vercel template for this phase: validates top-level `id` (chatId), a singular `message` object (with its standard fields), `selectedChatModel`, `selectedVisibilityType`. **Custom `documentId` is NOT included in this schema for this phase.**
- ✅ Adapted `selectedChatModel` enum to include project-specific models like 'n8n-assistant'.
- ✅ Exported `postRequestBodySchema` and `PostRequestBody` type.
- ✅ Defined proper message parts structure and attachment validation as per template.

**Objective (Original - For Reference, Scope for this Phase is Narrower):** Ensure the existing schema at `lib/db/schema.ts` is compatible with the new request body structure, OR create a new Zod schema for API validation if needed, that validates the new request body structure (singular `message` object with `id`, `createdAt`, `role`, `content`, `parts`, `experimental_attachments`) along with `id` (chatId), `selectedChatModel`, and `selectedVisibilityType`, as expected by the `/api/chat` POST endpoint, aligning with the Vercel template. **For this phase, the focus is only on the API validation schema (`app/(chat)/api/chat/schema.ts`) and it will NOT include the custom `documentId` field.**

**Directory Context:** The existing schema file is located at `lib/db/schema.ts` (database schema). May need API validation schema at `app/(chat)/api/chat/schema.ts`.

**Key Schema Elements to Define/Verify:**
*   **`textPartSchema`**: `z.object({ text: z.string().min(1).max(2000), type: z.enum(['text']) })`
*   **`postRequestBodySchema`**: A Zod object to validate the entire request body.
    *   `id`: `z.string().uuid()` (This is the Chat ID).
    *   `message`: `z.object({ ... })` (The single, new user message, with fields as per Vercel template).
        *   `id`: `z.string().uuid()` (ID of the message itself).
        *   `createdAt`: `z.coerce.date()` (Timestamp of message creation).
        *   `role`: `z.enum(['user'])` (Role must be 'user').
        *   `content`: `z.string().min(1).max(2000)` (The text content of the message).
        *   `parts`: `z.array(textPartSchema)` (Ensures content is structured as parts; can be derived from `content` if not directly provided, e.g., `[{ type: 'text', text: message.content }]`).
        *   `experimental_attachments`: `z.array(z.object({...})).optional()` (Schema for attachments, if used).
    *   `selectedChatModel`: `z.enum([...])` (e.g., `['chat-model', 'chat-model-reasoning', 'n8n-assistant']` - should reflect models available in *this* project).
    *   `selectedVisibilityType`: `z.enum(['public', 'private'])`.
    *   **Note:** The project-specific `documentId` field will be added to this schema in a later phase.
*   **`PostRequestBody` Type Export**: `export type PostRequestBody = z.infer<typeof postRequestBodySchema>;`

**Checklist:**

1.  🟢 **Step 2.1: Fetch LATEST Vercel Template `schema.ts`**
    *   **Action:** Find correct Vercel template schema path before attempting curl command (`app/(chat)/api/chat/schema.ts`).
    *   **Purpose:** Get the most up-to-date definitive schema structure from the Vercel template.
    *   **Verification:** Confirm the structure of `postRequestBodySchema`, especially the singular `message` object and its fields (`id`, `createdAt`, `role`, `content`, `parts`), and the top-level `id` (chatId), `selectedChatModel`, `selectedVisibilityType`.
    *   **COMPLETED:** ✅ Retrieved template schema.ts. Key findings:
        - Template validates: `{ id: uuid, message: { id, createdAt, role: 'user', content, parts, experimental_attachments }, selectedChatModel: ['chat-model', 'chat-model-reasoning'], selectedVisibilityType: ['public', 'private'] }`. **It does NOT include `documentId`.**
2.  🟢 **Step 2.2: Check for Existing Project Schemas**
    *   **Action (Search Comprehensively):** Use `file_search` query "schema".
    *   **Action (List Directory):** Use `list_dir` for `app/(chat)/api/chat/`.
    *   **Action (Read File if Exists):** If `app/(chat)/api/chat/schema.ts` exists, read it. Also read `lib/db/schema.ts`.
    *   **CRITICAL INSTRUCTION:** A complete Vercel project WILL have schema files. If you cannot find the expected schema file, search the entire project before concluding it doesn't exist. NEVER assume a production project lacks fundamental files.
    *   **Purpose:** Understand the current state of the project's schema file, if any.
    *   **COMPLETED:** ✅ Found database schema at `lib/db/schema.ts`. Confirmed missing API validation schema `app/(chat)/api/chat/schema.ts`.
3.  🟢 **Step 2.3: Plan `app/(chat)/api/chat/schema.ts` Creation (Template Alignment)**
    *   **Action:** Plan to create `app/(chat)/api/chat/schema.ts`.
    *   The content should be based *directly* on the Vercel template's `schema.ts` (fetched in Step 2.1). **It will NOT include `documentId` at this stage.**
    *   Adapt `selectedChatModel` enum for this project (e.g., add `'n8n-assistant'`).
    *   Ensure it exports `postRequestBodySchema` and the `PostRequestBody` type.
    *   **COMPLETED:** ✅ **PLAN:** Create new `app/(chat)/api/chat/schema.ts` based on Vercel template schema (no `documentId`). Adapt `selectedChatModel` enum.
4.  🟢 **Step 2.4: Prepare `edit_file` for `app/(chat)/api/chat/schema.ts` (Template Alignment)**
    *   **Action:** Construct `code_edit` for full content from template schema (Step 2.1), with `selectedChatModel` adapted.
    *   **Instruction (for `edit_file` call):** "Create app/(chat)/api/chat/schema.ts strictly aligned with Vercel template: validate top-level 'id' (chatId), a singular 'message' object (with standard fields), 'selectedChatModel' (adapted for this project), and 'selectedVisibilityType'. DO NOT include 'documentId' in this schema."
    *   **COMPLETED:** ✅ Prepared schema content based on Vercel template (no `documentId`) with n8n-assistant model added.
5.  🟢 **Step 2.5: Execute `edit_file` for `app/(chat)/api/chat/schema.ts`**
    *   **Action:** Call `edit_file` with the prepared arguments.
    *   **COMPLETED:** ✅ Created `app/(chat)/api/chat/schema.ts` with proper validation schema.
6.  🟢 **Step 2.6: Review Diff/Content and Verify `schema.ts` (Template Alignment)**
    *   **Action:** Carefully review the diff output or the full file content if newly created.
    *   **Verification:**
        *   Confirm `postRequestBodySchema` is correctly defined in `app/(chat)/api/chat/schema.ts`.
        *   Verify it includes: `id` (string, for chatId), `message` (object, for the single message, with fields `id`, `createdAt`, `role`, `content`, `parts`), `selectedChatModel` (enum, adapted for this project's models including 'n8n-assistant'), and `selectedVisibilityType`.
        *   **Verify it does NOT include `documentId`.**
        *   Confirm `PostRequestBody` type is exported.
        *   Confirm `textPartSchema` is defined and used in `message.parts`.
    *   **COMPLETED:** ✅ Schema created matching Vercel template structure (no `documentId`), with all required fields: id (chatId), message object with parts structure, selectedChatModel enum including 'n8n-assistant', selectedVisibilityType enum, and proper TypeScript exports.

---
## 🔴 Phase 3: Server-Side API Route `app/(chat)/api/chat/route.ts` (Template Alignment for Message Handling)
---

**Objective:** Adapt the `POST` handler in `app/(chat)/api/chat/route.ts` to align with the Vercel template's message handling:
1.  Correctly parse the new request body (containing a single `message` object, **without custom `documentId` for this phase**) using the schema from Phase 2.
2.  Fetch previous messages from the database.
3.  Reconstruct the full message history to be used by AI models.
4.  Ensure the N8N payload is correctly constructed using the single incoming `message` and the fetched history (maintaining N8N's expected structure).
5.  Correctly save the new user `message` to the database.
6.  **Project-specific logic for handling `documentId` to title chats and link Documents to Chats is DEFERRED to a later phase.** New chats in this phase will be titled using `generateTitleFromUserMessage` or similar.

**Directory Context:** The API route file is located at `app/(chat)/api/chat/route.ts`.

**Key Logic Flow Changes in `POST` Handler (This Phase - Template Alignment):**
*   **Request Parsing:**
    *   `const json = await request.json();`
    *   `const requestBody = postRequestBodySchema.parse(json);` (Import `postRequestBodySchema` from `./schema` - this schema does NOT include `documentId` yet).
    *   `const { id: chatId, message, selectedChatModel, selectedVisibilityType } = requestBody;` (Note: `documentId` is not parsed here).
*   **History Reconstruction:**
    *   `const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });`
    *   Map `previousMessagesFromDB` to `UIMessage[]` (e.g., `uiPreviousMessages`).
    *   `const fullMessagesForAI = appendClientMessage({ messages: uiPreviousMessages, message: message });` (Import `appendClientMessage` from `ai` SDK).
*   **N8N Payload (Conceptual - Maintaining current N8N structure):**
    *   `const userMessageContentForN8N = message.content;`
    *   `const historyForN8N = uiPreviousMessages;` (Or `formatMessagesForN8N(uiPreviousMessages)` if a specific formatting utility is used and necessary, ensuring N8N receives history in the format it expects).
*   **Saving User Message:**
    *   Construct the message to save using `chatId` and fields from the incoming `message` object:
        ```typescript
        const userMessageToSave = {
          chatId: chatId,
          id: message.id,
          role: message.role, // should be 'user'
          content: message.content, // Or derive from parts if that's the source of truth
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: message.createdAt || new Date(),
        };
        await saveMessages({ messages: [userMessageToSave] });
        ```
*   **Chat Creation (New Chats - This Phase):**
    *   If it's a new chat, the title will be generated using a function like `generateTitleFromUserMessage({ message })` as the `documentId`-based titling is deferred.
*   **Passing to AI:** Use `fullMessagesForAI` for `streamText` or other AI calls.

**Checklist:**

1.  🟢 **Step 3.1: Fetch LATEST Vercel Template `route.ts` (CRITICAL RE-FETCH)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/app/\(chat\)/api/chat/route.ts`
    *   **Purpose:** Confirm template's logic for parsing, history reconstruction, message saving, and chat creation (especially title generation when no `documentId` is involved).
    *   **Verification:**
        *   Import of `postRequestBodySchema`.
        *   Destructuring: `{ id, message, selectedChatModel, selectedVisibilityType } = requestBody`. (Confirm no `documentId`).
        *   Fetching history: `previousMessages = await getMessagesByChatId({ id })`.
        *   Reconstructing messages: `messages = appendClientMessage({ messages: previousMessages, message })`.
        *   New chat creation: How `saveChat` is called, especially `title` generation.
        *   User message saving.
2.  🟢 **Step 3.2: Fetch LATEST Vercel AI SDK Documentation (Server-Side Utilities)**
    *   **Action:** Use Context7 MCP for `/vercel/ai`. Topics: `appendClientMessage`, `streamText`, `UIMessage` vs. DB message types.
    *   **Purpose:** Reconfirm `appendClientMessage` usage and type needs.
    *   **Verification:** Signature of `appendClientMessage`. Output of `getMessagesByChatId`. Need for mapping DB messages to `UIMessage`.
3.  🟢 **Step 3.3: Read Current Project `app/(chat)/api/chat/route.ts`**
    *   **Action:** Read the full content.
    *   **Purpose:** Identify current logic accurately to ensure only necessary changes are made for template alignment in this phase, and custom `documentId` logic is correctly isolated for deferral.
4.  🟢 **Step 3.4: Plan Request Body Parsing Adaptation (Template Alignment)**
    *   **Action:**
        *   Add `import { postRequestBodySchema } from './schema';` (this schema does NOT include `documentId`).
        *   Modify `POST` handler to parse using this schema:
            ```typescript
            let requestBody: PostRequestBody;
            try {
              const json = await request.json();
              requestBody = postRequestBodySchema.parse(json); // schema.ts (template aligned, no documentId)
            } catch (error) { /* ... Zod error handling ... */ }
            const { id: chatId, message, selectedChatModel, selectedVisibilityType } = requestBody; // No documentId
            ```
    *   **Verification:** Error handling.
5.  🟢 **Step 3.5: Plan Message History Reconstruction (Template Alignment)**
    *   **Action:**
        *   Call: `const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });`
        *   Map `previousMessagesFromDB` (e.g., `Message_v2[]`) to `UIMessage[]` (call it `uiPreviousMessages`).
        *   Assemble: `const fullMessagesForAI = appendClientMessage({ messages: uiPreviousMessages, message: message });`
    *   **Verification:** Plan for type mapping if `getMessagesByChatId` output isn't directly `UIMessage[]`.
6.  🟢 **Step 3.6: Plan N8N Payload Construction (Maintaining Current N8N Structure, Using New Variables)**
    *   **Action:**
        *   Adapt existing N8N payload logic.
        *   User message details from the single `message` object.
        *   `history` for N8N from `uiPreviousMessages` (mapped from `previousMessagesFromDB`).
            ```typescript
            const userMessageContentForN8N = message.content; // Or JSON.stringify if not string
            const historyForN8N = uiPreviousMessages; // Or apply existing formatting if needed, e.g., formatMessagesForN8N(uiPreviousMessages)
            const n8nPayload = {
              chatId: chatId,
              userId: userProfileId, // From existing auth logic
              messageId: message.id,
              userMessage: userMessageContentForN8N,
              userMessageParts: message.parts,
              userMessageDatetime: message.createdAt,
              history: historyForN8N,
              // Any other fields N8N currently expects, e.g., google_token
            };
            ```
    *   **Verification:** Ensure N8N still receives the current user message content distinctly from the historical messages, with identical payload keys as current. **`documentId` is NOT added to N8N payload.**
7.  🟢 **Step 3.7: Plan Database `saveMessages` Call for User Message (Template Alignment)**
    *   **Action:** Plan to save the incoming `message` object.
        ```typescript
        const userMessageToSave = {
          chatId: chatId,
          id: message.id,
          role: message.role,
          parts: message.parts, // Ensure these fields exist on 'message'
          attachments: message.experimental_attachments ?? [],
          createdAt: message.createdAt || new Date(),
        };
        await saveMessages({ messages: [userMessageToSave] });
        ```
8.  🟢 **Step 3.8: Plan Chat Creation Logic (New Chats - Template Alignment)**
    *   **Action:** For new chats (e.g., first message from user for a given `chatId`):
        *   The server will determine if it's a new chat (e.g., `await getChatById({ id: chatId })` returns null).
        *   If new, a title will be generated: `const newChatTitle = await generateTitleFromUserMessage({ message });` (or similar utility).
        *   Call `await saveChat({ id: chatId, userId: userProfileId, title: newChatTitle, visibility: selectedVisibilityType });`.
    *   **Verification:** This defers the custom `documentId`-based titling.
9.  🟢 **Step 3.9: Plan AI Call Adaptation (e.g., `streamText`)**
    *   **Action:** Ensure AI calls like `streamText` use `fullMessagesForAI`.
    *   **Verification:** Other parameters for `streamText` (system prompt, tools, etc.) should be reviewed to ensure they align with the template or existing project needs that are independent of `documentId`.
10. 🔴 **Step 3.10: Prepare `edit_file` for `app/(chat)/api/chat/route.ts`**
    *   **Action:** Construct the `code_edit` string incorporating changes from Steps 3.4-3.9.
        *   Isolate and temporarily comment out or remove the project's custom `documentId` handling logic within the API route (related to fetching document titles for chat titles and updating `Document.chatId`). This logic will be restored in Phase 6.
    *   **Instruction (for `edit_file` call):** "Adapt /api/chat POST route for template message flow: use schema for single 'message' body (no documentId), reconstruct history, use template-aligned chat creation (title from message). Temporarily remove/comment custom documentId logic. Ensure N8N payload is correct."
11. 🔴 **Step 3.11: Execute `edit_file` for `app/(chat)/api/chat/route.ts`**
12. 🔴 **Step 3.12: Review Diff and Verify Changes in `app/(chat)/api/chat/route.ts`**
    *   **Verification (CRITICAL):**
        *   Confirm parsing of `chatId`, `message` (no `documentId`).
        *   Confirm `previousMessagesFromDB` fetched, `fullMessagesForAI` assembled.
        *   Confirm N8N payload uses `message` and `uiPreviousMessages` correctly.
        *   Confirm user message saved using `message`.
        *   Confirm new chat titles are generated from `message.content` (not `documentId`).
        *   Confirm custom `documentId` logic for chat creation/linking is NOT active.
        *   Confirm AI calls use `fullMessagesForAI`.
13. 🔴 **Step 3.13: Run Linter/Type-Checker for `app/(chat)/api/chat/route.ts`**

---
## Phase 4: Testing and Verification (After Deployment of Template-Aligned Message Handling)
---

**Objective:** Thoroughly test the changes end-to-end after deploying to Vercel to ensure the bug is fixed and no regressions were introduced, paying close attention to previously observed anomalies, especially the 404 errors for `/api/messages` due to chat creation/visibility issues.

1.  🔴 **Step 4.1: Add/Confirm Unique Console Logs for Debugging**
    *   **Action (Client - `components/chat.tsx`):** Ensure `experimental_prepareRequestBody` logs its input and output. Add/confirm logs around `setIsN8nProcessing` calls. Add/confirm logs in `handleFormSubmit` showing input and model. Use unique prefixes like `[CLIENT_PREPARE_BODY_DEBUG]`, `[N8N_STATE_DEBUG]`, `[CHAT_HANDLE_SUBMIT_DEBUG]`. Add logs in `onFinish` and `onError` of `useChat`. Add logs for SWR polling attempts to `/api/messages` showing the URL being called.
    *   **Action (Server - `app/(chat)/api/chat/route.ts`):** Add/confirm logs for:
        *   A unique marker at the very start of the `POST` handler execution.
        *   The raw request body received (after `await req.json()`, before parsing).
        *   The parsed `requestBody` (after schema validation).
        *   `newSingleUserMessage` and `chatId`.
        *   The result of `await getChatById({ id: chatId })` (i.e., if chat was found or not *before* attempting to save).
        *   A log statement specifically if `saveChat` is called for a new chat.
        *   `previousMessagesFromDB` (e.g., number of messages fetched, content of last few).
        *   `fullMessagesForAI` (e.g., number of messages, content of last message).
        *   Payload being sent to N8N (`userMessageForN8N`, `historyForN8N` contents/lengths). Use unique prefixes `[SERVER_API_CHAT_DEBUG]`.
    *   *Assistant Note: These logs might be part of the edits in Phase 1 and 3, but confirm they are sufficiently detailed for debugging this specific issue and verifying deployment of new code.*
2.  🔴 **Step 4.2: Commit and Push Preliminary Changes for Testing**
    *   **Action:** `git add .`
    *   **Action:** `git commit -m "feat: Implement experimental_prepareRequestBody and server-side history reconstruction for N8N fix (with enhanced logging)"`
    *   **Action:** `git push`
    *   **Purpose:** Deploy changes to Vercel for live testing.
3.  🔴 **Step 4.3: Monitor Vercel Deployment & Verify Bundle Update**
    *   **Action:** Wait for Vercel deployment to complete successfully.
    *   **Action:** Perform a hard refresh (Cmd+Shift+R or Ctrl+Shift+R) in the browser.
    *   **Verification:** Check browser console for the unique client-side log markers (e.g., `[CLIENT_PREPARE_BODY_DEBUG]`) added in Step 4.1. Check Vercel runtime logs for the unique server-side markers. **If new log markers do not appear, suspect a caching/stale bundle issue and investigate before proceeding.**
4.  🔴 **Step 4.4: Fetch LATEST Vercel Template `components/chat.tsx` (AGAIN, for sanity check post-edit)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/components/chat.tsx`
    *   **Purpose:** Quick visual check against the template if any unexpected client-side behavior is observed during testing. Not for direct code change unless a major oversight is found.
5.  🔴 **Step 4.5: Functional Test - Standard Streaming Model**
    *   **Action:** Perform a chat with a standard streaming model (not N8N).
    *   **Verification:** Ensure messages stream correctly, history is maintained, no console errors. Observe client-side logs for `onFinish` calls to see if they behave as expected (e.g., not firing multiple times without reason).
6.  🔴 **Step 4.6: Functional Test - N8N Model - First Message**
    *   **Action:** Start a new chat and send the first message with the N8N model selected.
    *   **Verification:**
        *   Message appears in UI.
        *   "Thinking..." animation appears while `isN8nProcessing` is true.
        *   N8N responds correctly to the first message.
        *   Response appears in UI in real-time (SWR polling works).
        *   Check Browser Console:
            *   Verify `[CLIENT_PREPARE_BODY_DEBUG]` logs show only the first message being sent.
            *   Verify `[N8N_STATE_DEBUG]` logs show correct state transitions.
            *   Observe `useChat` callbacks (`onFinish`, `onError`) for expected behavior.
        *   Check Vercel Logs for `/api/chat` call:
            *   Verify `[SERVER_API_CHAT_DEBUG]` logs confirm only ONE `/api/chat` invocation for this user message.
            *   Verify `[SERVER_API_CHAT_DEBUG]` logs show that `getChatById` initially might not find the chat, but then `saveChat` is called successfully.
            *   Incoming `requestBody` contains the single first message; **verify no unexpected, older assistant messages are present in this payload.**
            *   `previousMessagesFromDB` is empty or as expected for a new chat (after `saveChat` has run, `getMessagesByChatId` should operate on a valid chat context).
            *   `fullMessagesForAI` contains only the first user message.
            *   N8N payload (`userMessageForN8N`, `historyForN8N`) is correct for a first message.
        *   Check N8N Workflow: Confirm it received the first message content correctly and history is empty/as expected. **Confirm only ONE N8N webhook invocation for this message.**
        *   **Check Vercel Logs for `/api/messages` (SWR Polling):** Verify `[SERVER_API_MESSAGES_DEBUG]` logs show the polling request. Crucially, confirm that `getChatById` *within this route* successfully finds the chat. **If it reports "chat not found" here, this is a critical issue to investigate (potential race condition, caching on `getChatById`, or DB delay).** Ensure no 404s from `/api/messages` due to "chat not found".
7.  🔴 **Step 4.7: Fetch LATEST Vercel AI SDK Docs (AGAIN, if issues with N8N message structure or hook behavior)**
    *   **Action:** Context7 MCP for `/vercel/ai`, topic: "UIMessage structure", "Message object format", "useChat callbacks", "useChat state".
    *   **Purpose:** If N8N receives malformed message/history, or if `useChat` hook behaves unexpectedly (e.g. multiple `onFinish` calls), re-verify SDK expectations.
8.  🔴 **Step 4.8: Functional Test - N8N Model - Second Message (CRITICAL TEST)**
    *   **Action:** Send a second, different message in the same N8N chat.
    *   **Verification:**
        *   Message appears in UI.
        *   "Thinking..." animation.
        *   **N8N responds correctly to the SECOND message (not the first one again).**
        *   Response appears in UI in real-time.
        *   Check Browser Console:
            *   `[CLIENT_PREPARE_BODY_DEBUG]` logs show only the second message being sent.
            *   Observe `useChat` callbacks.
        *   Check Vercel Logs for `/api/chat` call:
            *   Verify `[SERVER_API_CHAT_DEBUG]` logs confirm only ONE `/api/chat` invocation for this user message (i.e., **no "Phantom Call" observed** sending stale data).
            *   Verify `[SERVER_API_CHAT_DEBUG]` logs show `getChatById` finds the existing chat created in the previous turn.
            *   Incoming `requestBody` contains the single second message; **verify no unexpected, older assistant messages are present in this payload from the first turn.**
            *   `previousMessagesFromDB` contains the first user message and N8N's first response.
            *   `fullMessagesForAI` contains all four messages (User1, AI1, User2).
            *   N8N payload (`userMessageForN8N`) is the content of User2. `historyForN8N` contains User1 and AI1.
        *   Check N8N Workflow: Confirm it received the second message content correctly and the correct preceding history. **Confirm only ONE N8N webhook invocation for this second message.**
        *   **Check Vercel Logs for `/api/messages` (SWR Polling):** Again, verify `[SERVER_API_MESSAGES_DEBUG]` logs show `getChatById` finds the chat. Ensure no 404s.
9.  🔴 **Step 4.9: Fetch LATEST Vercel Template `app/(chat)/api/chat/route.ts` (AGAIN, if server logic seems off)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/app/\\(chat\\)/api/chat/route.ts`
    *   **Purpose:** If server-side history reconstruction or N8N payload seems problematic, re-verify against template.
10. 🔴 **Step 4.10: Functional Test - N8N Model - Multiple Subsequent Messages**
    *   **Action:** Send 2-3 more messages.
    *   **Verification:** Continue verifying points from Step 4.8 for each message (correct response, correct logs, single N8N invocation).
11. 🔴 **Step 4.11: Test General Chat Features (Regression)**
    *   **Action:** Test message editing, regeneration (if applicable), message voting.
    *   **Verification:** Ensure these features still work as expected.

---
## Phase 5: Final Code Cleanup & Commit (For Template-Aligned Message Handling)
---

1.  🔴 **Step 5.1: Review and Remove/Refine Debug Logs**
    *   **Action:** Decide which diagnostic `console.log` statements (added in Step 4.1) can be removed or reduced in verbosity. Critical pathway logs might be kept if deemed useful for future, less verbose.
    *   **Action:** If logs are modified, prepare and execute `edit_file` for `components/chat.tsx` and `app/(chat)/api/chat/route.ts`. Review diffs.
2.  🔴 **Step 5.2: Final Linter/Type-Check Pass**
    *   **Action:** `pnpm lint:fix` and `pnpm typecheck`.
    *   **Verification:** Ensure no issues.
3.  🔴 **Step 5.3: Final Code Review (Self/User)**
    *   **Action:** Read through all changed files one last time.
    *   **Purpose:** Sanity check for any obvious errors, commented-out code, or leftover debug artifacts.
4.  🔴 **Step 5.4: Commit Final Changes**
    *   **Action:** `git add .`
    *   **Action:** `git commit -m "fix: N8N responds to correct message and avoids duplicates via experimental_prepareRequestBody"` (Or a more refined message based on final outcome).
5.  🔴 **Step 5.5: Push Final Changes**
    *   **Action:** `git push`
6.  🔴 **Step 5.6: (User Task) Optional: Delete `IMPLEMENTATION_CHECKLIST_N8N_BUGFIX.md` or archive it.**

---
## 🔴 Phase 6: Restore Custom `documentId` Chat Association
---

**Objective:** Re-integrate the project's custom functionality where a new chat can be associated with an existing `documentId`, using the document's title for the chat title, and linking the `Document` record to the `Chat` record in the database. This phase builds upon the template-aligned message handling established in Phases 1-3.

**Checklist:**

1.  🔴 **Step 6.1: Update Client-Side `components/chat.tsx` for `documentId`**
    *   **Action:** Modify `experimental_prepareRequestBody` in `useChat` options.
        *   Source the `documentId` (e.g., from `initialAssociatedDocument.id` or component state if it can change).
        *   Add `documentId` to the payload object returned by `experimental_prepareRequestBody`.
            ```typescript
            // Example addition to components/chat.tsx experimental_prepareRequestBody
            // const documentIdToSend = initialAssociatedDocument ? initialAssociatedDocument.id : undefined;
            return {
              id: id, // chatId
              message: latestMessage,
              selectedChatModel: selectedChatModel,
              selectedVisibilityType: selectedVisibilityType,
              documentId: documentIdToSend // ADD THIS
            };
            ```
    *   **Instruction (for `edit_file` call):** "Update experimental_prepareRequestBody in components/chat.tsx to include documentId in the payload sent to /api/chat."
    *   **Verification:** Test client-side to ensure `documentId` is correctly included when a chat is initiated with an associated document.
2.  🔴 **Step 6.2: Update API Schema `app/(chat)/api/chat/schema.ts` for `documentId`**
    *   **Action:** Modify `postRequestBodySchema`.
        *   Add `documentId: z.string().uuid().optional()` to the schema.
    *   **Instruction (for `edit_file` call):** "Add 'documentId: z.string().uuid().optional()' to postRequestBodySchema in app/(chat)/api/chat/schema.ts."
    *   **Verification:** Ensure schema correctly validates requests with or without `documentId`.
3.  🔴 **Step 6.3: Update Server-Side `app/(chat)/api/chat/route.ts` to Handle `documentId`**
    *   **Action (Request Parsing):**
        *   Update destructuring from `requestBody` to include `documentId`:
            `const { id: chatId, message, selectedChatModel, selectedVisibilityType, documentId } = requestBody;`
    *   **Action (Chat Creation Logic):**
        *   Re-integrate/uncomment the custom logic for new chat creation when `documentId` is present:
            *   If `isNewChatAttempt` AND `documentId` is provided:
                *   Fetch document title using `documentId` and `userId`.
                *   Use document title for `saveChat`.
                *   Update `Document` table to set `chatId` for the given `documentId`.
            *   Else (if new chat but no `documentId`), use `generateTitleFromUserMessage({ message })`.
    *   **Instruction (for `edit_file` call):** "Reinstate documentId handling in /api/chat: parse documentId from request, use it for new chat titling, and link Document to Chat in DB."
    *   **Verification:** Ensure existing chat creation logic that uses `documentId` works as before.
4.  🔴 **Step 6.4: Testing and Verification (End-to-End for `documentId` feature)**
    *   **Action:** Thoroughly test scenarios:
        *   Starting a new chat *with* an associated document: verify chat title, DB link (`Document.chatId`).
        *   Starting a new chat *without* an associated document: verify chat title generated from message.
        *   Existing chats (ensure no regressions).
        *   N8N model chats with and without associated documents.
    *   **Verification:** Check UI, DB state, and logs.
5.  🔴 **Step 6.5: Final Linter/Type-Check Pass (After `documentId` Re-integration)**
6.  🔴 **Step 6.6: Final Code Review (Self/User - After `documentId` Re-integration)**
7.  🔴 **Step 6.7: Commit Final Changes (Including `documentId` Restoration)**
    *   **Action:** `git add .`
    *   **Action:** `git commit -m "feat: Restore custom documentId chat association logic"` (or similar)
8.  🔴 **Step 6.8: Push Final Changes**

---
**Checklist End.** 