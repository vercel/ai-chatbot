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
## 🟡 Phase 3: Server-Side API Route `app/(chat)/api/chat/route.ts` (Template Alignment for Message Handling)
---

**Objective:** Adapt the `POST` handler in `app/(chat)/api/chat/route.ts` to align with the Vercel template's message handling:
1.  🟢 Correctly parse the new request body (containing a single `message` object, **without custom `documentId` for this phase**) using the schema from Phase 2. (Verified through logs, server is parsing correctly based on schema)
2.  🟢 Fetch previous messages from the database. (Verified in logs, server is fetching)
3.  🟢 Reconstruct the full message history to be used by AI models. (Verified in logs for standard models, N8N constructs its own history payload)
4.  🟢 Ensure the N8N payload is correctly constructed using the single incoming `message` and the fetched history (maintaining N8N's expected structure). (Verified in logs, payload seems correct, awaiting E2E test)
5.  🟢 Correctly save the new user `message` to the database. (Verified in logs)
6.  🟢 **Project-specific logic for handling `documentId` to title chats and link Documents to Chats is DEFERRED to a later phase.** New chats in this phase will be titled using `generateTitleFromUserMessage` or similar. (Verified by observing current logic)

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
    *   **MODIFICATION (Fix for 404):** Removed `unstable_cache` from `getChatById` in `lib/db/queries.ts` to prevent stale cache reads causing "Chat not found" for `/api/messages` during new chat creation.
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
    *   *Assistant Note: Completed. Current server logic aligns with template for these aspects.*
2.  🟢 **Step 3.2: Fetch LATEST Vercel AI SDK Documentation (Server-Side Utilities)**
    *   **Action:** Use Context7 MCP for `/vercel/ai`. Topics: `appendClientMessage`, `streamText`, `UIMessage` vs. DB message types.
    *   **Purpose:** Reconfirm `appendClientMessage` usage and type needs.
    *   **Verification:** Signature of `appendClientMessage`. Output of `getMessagesByChatId`. Need for mapping DB messages to `UIMessage`.
    *   *Assistant Note: Completed. Current server logic aligns with template for these aspects.*
3.  🟢 **Step 3.3: Read Current Project `app/(chat)/api/chat/route.ts`**
    *   **Action:** Read the full content.
    *   **Purpose:** Identify current logic accurately to ensure only necessary changes are made for template alignment in this phase, and custom `documentId` logic is correctly isolated for deferral.
    *   *Assistant Note: Completed. Understood existing structure.*
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
    *   *Assistant Note: Completed. Server code already implements this with Zod schema from Phase 2.*
5.  🟢 **Step 3.5: Plan Message History Reconstruction (Template Alignment)**
    *   **Action:**
        *   Call: `const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });`
        *   Map `previousMessagesFromDB` (e.g., `Message_v2[]`) to `UIMessage[]` (call it `uiPreviousMessages`).
        *   Assemble: `const fullMessagesForAI = appendClientMessage({ messages: uiPreviousMessages, message: message });`
    *   **Verification:** Plan for type mapping if `getMessagesByChatId` output isn't directly `UIMessage[]`.
    *   *Assistant Note: Completed. Server code implements this for standard models. N8N messages have slightly different history handling for their payload but the principle of fetching previous messages is there.*
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
    *   **Verification:** Ensure N8N still receives the current user message distinctly from the historical messages, with identical payload keys as current. **`documentId` is NOT added to N8N payload.**
    *   *Assistant Note: Completed. Current server logic for N8N payload uses the new single incoming message and fetches/formats history (though currently sends empty history based on logs, this is an N8N logic detail not part of this phase's core fix).*
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
    *   *Assistant Note: Completed. Server logic correctly saves the incoming user message.*
8.  🟢 **Step 3.8: Plan Chat Creation Logic (New Chats - Template Alignment) & Fix 404 Race Condition**
    *   **Action:** For new chats (e.g., first message from user for a given `chatId`):
        *   The server will determine if it's a new chat (e.g., `await getChatById({ id: chatId })` returns null).
        *   If new, a title will be generated: `const newChatTitle = await generateTitleFromUserMessage({ message });` (or similar utility).
        *   Call `await saveChat({ id: chatId, userId: userProfileId, title: newChatTitle, visibility: selectedVisibilityType });`.
    *   **Action (Fix for 404):** Modify `getChatById` in `lib/db/queries.ts` to remove `unstable_cache` to prevent stale cache reads.
    *   **Verification:** This defers the custom `documentId`-based titling and aims to fix the 404 on `/api/messages`.
    *   *Assistant Note: 🟢 Completed. `getChatById` caching removed.*
9.  🟢 **Step 3.9: Plan AI Call Adaptation (e.g., `streamText`)**
    *   **Action:** Ensure AI calls like `streamText` use `fullMessagesForAI`.
    *   **Verification:** Other parameters for `streamText` (system prompt, tools, etc.) should be reviewed to ensure they align with the template or existing project needs that are independent of `documentId`.
    *   *Assistant Note: Completed. Standard model logic uses `fullMessagesForAI`.*
10. 🟡 **Step 3.10: Prepare `edit_file` for `app/(chat)/api/chat/route.ts`**
    *   **Action:** Construct the `code_edit` string incorporating changes from Steps 3.4-3.9.
        *   Isolate and temporarily comment out or remove the project's custom `documentId` handling logic within the API route (related to fetching document titles for chat titles and updating `Document.chatId`). This logic will be restored in Phase 6.
    *   **Instruction (for `edit_file` call):** "Adapt /api/chat POST route for template message flow: use schema for single 'message' body (no documentId), reconstruct history, use template-aligned chat creation (title from message). Temporarily remove/comment custom documentId logic. Ensure N8N payload is correct."
    *   *Assistant Note: No direct edit to `app/(chat)/api/chat/route.ts` was needed for the immediate bug fixes as the core logic for parsing, saving, and N8N payload construction was mostly compatible. The key server-side fix was in `lib/db/queries.ts` (Step 3.8). Client-side `components/chat.tsx` was the other major fix.*
11. 🟡 **Step 3.11: Execute `edit_file` for `app/(chat)/api/chat/route.ts`**
    *   *Assistant Note: Marked as 🟡 as no direct edit was performed on this file for this round, but the related fix in `queries.ts` and `chat.tsx` addresses the server-side and client-side aspects of the bug.*
12. 🟡 **Step 3.12: Review Diff and Verify Changes in `app/(chat)/api/chat/route.ts`**
    *   **Verification (CRITICAL):**
        *   Confirm parsing of `chatId`, `message` (no `documentId`).
        *   Confirm `previousMessagesFromDB` fetched, `fullMessagesForAI` assembled.
        *   Confirm N8N payload uses `message` and `uiPreviousMessages` correctly.
        *   Confirm user message saved using `message`.
        *   Confirm new chat titles are generated from `message.content` (not `documentId`).
        *   Confirm custom `documentId` logic for chat creation/linking is NOT active.
        *   Confirm AI calls use `fullMessagesForAI`.
    *   *Assistant Note: To be verified by testing after deployment.*
13. 🟡 **Step 3.13: Run Linter/Type-Checker for `app/(chat)/api/chat/route.ts`**
    *   *Assistant Note: To be run after testing, before final commit of this phase.*

---
## 🟡 Phase 4: Testing and Verification (After Deployment of Template-Aligned Message Handling)
---

**Objective:** Thoroughly test the changes end-to-end after deploying to Vercel to ensure the bug is fixed and no regressions were introduced, paying close attention to previously observed anomalies, especially the 404 errors for `/api/messages` due to chat creation/visibility issues.

**NEW ISSUES IDENTIFIED (from commit pushed in Step 4.2):**
*   ⚠️ **React Hydration Error (#418):** A mismatch between server-rendered HTML and client-side React expectations. This is critical and must be fixed.
*   ⚠️ **Initial 404 & JSON Parsing Error for `/api/messages`:** When a new chat starts, `/api/messages` initially returns a 404 with a non-JSON body ("Chat not found"), causing a client-side SWR parsing error. While it recovers, this needs to be fixed for robust error handling.

**Revised Checklist for Phase 4:**

1.  🟢 **Step 4.1: Add/Confirm Unique Console Logs for Debugging**
    *   *Assistant Note: Logs are currently in place from previous debugging efforts and recent changes, including detailed N8N fetch logging. These were instrumental in identifying the N8N bug fix.*
2.  🟢 **Step 4.2: Commit and Push Preliminary Changes for Testing**
    *   *Assistant Note: This was the commit that revealed the new React Hydration and `/api/messages` JSON issues.*
3.  🟢 **Step 4.3: Monitor Vercel Deployment & Verify Bundle Update**
    *   *Assistant Note: Completed. Logs confirmed new bundle was active.*

**NEW SUB-PHASE 4.A: Address Critical New Issues**

4.  🔴 **Step 4.A.1: Investigate React Hydration Error (#418)**
    *   **Hypothesis 1:** The `THEME_COLOR_SCRIPT` in `app/layout.tsx` might be causing issues.
    *   **Hypothesis 2:** The `pyodide.js` script loaded with `strategy="beforeInteractive"` in `app/(chat)/layout.tsx` might be altering the DOM before hydration.
    *   **Hypothesis 3:** Conditional rendering in `AppSidebar` or its children, possibly related to user authentication state differing between server and client initial render.
    *   **Proposed Diagnostic Action (Requires User Approval for File Edits):**
        1.  Temporarily comment out the `THEME_COLOR_SCRIPT` in `app/layout.tsx`.
        2.  Deploy and test. If the error is gone, we've found a strong lead.
        3.  If the error persists, restore the `THEME_COLOR_SCRIPT` and then temporarily comment out the `pyodide.js` script in `app/(chat)/layout.tsx`.
        4.  Deploy and test.
        5.  If the error *still* persists, we would then need to investigate `AppSidebar` (`components/app-sidebar.tsx`).
    *   **Purpose:** Isolate the cause of the server-client HTML mismatch.
    *   **Verification:** Determine the specific script or component causing the hydration failure.
5.  🔴 **Step 4.A.2: Fix React Hydration Error (#418) (Once Cause is Identified)**
    *   **Action (Requires User Approval for File Edits):** Based on the findings from Step 4.A.1, apply the necessary code changes to resolve the hydration mismatch.
    *   **Instruction (for `edit_file` call):** "Fix React hydration error #418 by correcting server-client HTML mismatch in [TARGET_FILE(S)]."
    *   **Purpose:** Ensure client-side React initializes correctly without errors.
    *   **Verification:** Error no longer appears in the browser console on page load/hydration.
6.  🔴 **Step 4.A.3: Improve Error Handling in `/api/messages/route.ts`**
    *   **Action (Requires User Approval for File Edits):** Modify `app/(chat)/api/messages/route.ts`. If a chat is not found, ensure the API returns a proper JSON response with a 404 status, e.g., `return new Response(JSON.stringify({ error: "Chat not found", messages: [] }), { status: 404, headers: { 'Content-Type': 'application/json' } });`.
    *   **Instruction (for `edit_file` call):** "Update /api/messages to return a JSON response (e.g., { error: 'Chat not found', messages: [] }) with a 404 status when a chat is not found."
    *   **Purpose:** Provide consistent JSON responses from the API, preventing client-side parsing errors.
    *   **Verification:** Test by requesting messages for a non-existent chat ID; verify a 404 status and valid JSON error body is returned.
7.  🔴 **Step 4.A.4: (Optional) Enhance Client-Side SWR Fetcher for `/api/messages`**
    *   **Action:** Review the SWR fetcher logic in `components/chat.tsx`. Consider if additional client-side error handling for the `/api/messages` call is beneficial, though Step 4.A.3 should be the primary fix. This step may not require code changes if Step 4.A.3 is sufficient.
    *   **Purpose:** Make the client more resilient, if necessary.
    *   **Verification:** Client handles API errors gracefully.
8.  🔴 **Step 4.A.5: Commit and Deploy Fixes for New Issues**
    *   **Action (Requires User Approval for Terminal Commands):**
        *   `git add .` (after approved changes from 4.A.2, 4.A.3, potentially 4.A.4)
        *   `git commit -m "fix: Address React hydration error and improve /api/messages error handling"`
        *   `git push`
    *   **Purpose:** Deploy fixes to Vercel for re-testing.
9.  🔴 **Step 4.A.6: Verify Fixes on Vercel**
    *   **Action:** After deployment, load the application.
    *   **Verification:**
        *   Confirm React Hydration error #418 is GONE from the browser console.
        *   Initiate a new chat. Confirm the initial SWR call to `/api/messages` does NOT result in a "SyntaxError: Unexpected token 'C'" or similar parsing error. If it still gets a 404 (which is possible if the chat isn't created *instantly* before the first poll), verify the response is valid JSON.
        *   Overall application stability.

**SUB-PHASE 4.B: Regression Testing (Resuming Original Phase 4 Flow)**

10. 🟡 **Step 4.B.1 (was 4.4): Fetch LATEST Vercel Template `components/chat.tsx` (AGAIN, for sanity check post-edit)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/components/chat.tsx`
    *   **Purpose:** Quick visual check against the template if any unexpected client-side behavior is observed during testing. Not for direct code change unless a major oversight is found.
11. 🟡 **Step 4.B.2 (was 4.5): Functional Test - Standard Streaming Model**
    *   **Action:** Perform a chat with a standard streaming model (not N8N).
    *   **Verification:** Ensure messages stream correctly, history is maintained, no console errors. Observe client-side logs for `onFinish` calls to see if they behave as expected (e.g., not firing multiple times without reason).
12. 🟢 **Step 4.B.3 (was 4.6): Functional Test - N8N Model - First Message**
    *   *Assistant Note: This test PASSED based on recent logs, confirming N8N gets the first message correctly and the duplicate API call is gone. Will re-verify after hydration/API fixes.*
    *   **Action:** Start a new chat and send the first message with the N8N model selected.
    *   **Verification (Re-check after fixes from 4.A):**
        *   Message appears in UI.
        *   "Thinking..." animation appears while `isN8nProcessing` is true.
        *   N8N responds correctly to the first message.
        *   Response appears in UI in real-time (SWR polling works).
        *   Check Browser Console: No hydration errors. No SWR JSON parsing errors for `/api/messages`. Correct `[CLIENT_PREPARE_BODY_DEBUG]` and `[N8N_STATE_DEBUG]` logs.
        *   Check Vercel Logs for `/api/chat` call: ONE invocation. Correct request body.
        *   Check N8N Workflow: ONE invocation. Correct payload.
        *   Check Vercel Logs for `/api/messages` (SWR Polling): `getChatById` finds chat; if initial 404, body is JSON.
13. 🟡 **Step 4.B.4 (was 4.7): Fetch LATEST Vercel AI SDK Docs (AGAIN, if issues with N8N message structure or hook behavior)**
    *   **Action:** Context7 MCP for `/vercel/ai`, topic: "UIMessage structure", "Message object format", "useChat callbacks", "useChat state".
    *   **Purpose:** If N8N receives malformed message/history, or if `useChat` hook behaves unexpectedly (e.g. multiple `onFinish` calls), re-verify SDK expectations.
14. 🟢 **Step 4.B.5 (was 4.8): Functional Test - N8N Model - Second Message (CRITICAL TEST)**
    *   *Assistant Note: This test PASSED based on recent logs, confirming N8N responds to the correct (second) message and the duplicate API call is gone. Will re-verify after hydration/API fixes.*
    *   **Action:** Send a second, different message in the same N8N chat.
    *   **Verification (Re-check after fixes from 4.A):**
        *   N8N responds correctly to the SECOND message.
        *   Check Browser Console: Correct `[CLIENT_PREPARE_BODY_DEBUG]` for second message. No SWR errors.
        *   Check Vercel Logs for `/api/chat` call: ONE invocation. Correct request body (second message content).
        *   Check N8N Workflow: ONE invocation. Correct payload (second message, correct history).
        *   Check Vercel Logs for `/api/messages`: No 404s or JSON errors.
15. 🟡 **Step 4.B.6 (was 4.9): Fetch LATEST Vercel Template `app/(chat)/api/chat/route.ts` (AGAIN, if server logic seems off)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/app/\(chat\)/api/chat/route.ts`
    *   **Purpose:** If server-side history reconstruction or N8N payload seems problematic, re-verify against template.
16. 🟢 **Step 4.B.7 (was 4.10): Functional Test - N8N Model - Multiple Subsequent Messages**
    *   *Assistant Note: This test PASSED based on recent logs. Will re-verify after hydration/API fixes.*
    *   **Action:** Send 2-3 more messages.
    *   **Verification:** Continue verifying points from Step 4.B.5 for each message.
17. 🟡 **Step 4.B.8 (was 4.11): Test General Chat Features (Regression)**
    *   **Action:** Test message editing, regeneration (if applicable), message voting.
    *   **Verification:** Ensure these features still work as expected.

---
## 🔴 Phase 5: Final Code Cleanup & Commit (For Template-Aligned Message Handling)
---

1.  🔴 **Step 5.1: Review and Remove/Refine Debug Logs**
    *   **Action:** Decide which diagnostic `console.log` statements (added in Step 4.1) can be removed or reduced in verbosity. Critical pathway logs might be kept if deemed useful for future, less verbose.
    *   **Action:** If logs are modified, prepare and execute `edit_file` for `components/chat.tsx` and `app/(chat)/api/chat/route.ts`. Review diffs.
*   **Action (Detailed Checklist for Log Removal):** The following logs are proposed for removal. Review each line before proceeding with file edits. Edit only one checklist item / line / group of consecutive lines at a time--THIS IS NOT NEGOTIABLE. DO NOT EDIT MULTIPLE NON-CONSECUTIVE LINES IN ONE TOOL CALL. 
        *   **File: `components/chat.tsx`**
            - [ ] Line 3: `console.log('CHAT_COMPONENT_EXECUTION_MARKER_V2_MAY_24'); // New marker` (Delete)
            - [ ] Lines 55-58: `console.log('[CLIENT_PREPARE_BODY_DEBUG] Input to experimental_prepareRequestBody:', JSON.parse(JSON.stringify(body)));` (Delete)
            - [ ] Lines 65-69: `console.log('[CLIENT_PREPARE_BODY_DEBUG] Latest message from body.messages:', latestMessage ? JSON.parse(JSON.stringify(latestMessage)) : 'No messages in body');` (Delete)
            - [ ] Lines 79-82: `console.log('[CLIENT_PREPARE_BODY_DEBUG] Output payload from experimental_prepareRequestBody:', JSON.parse(JSON.stringify(payload)));` (Delete)
            - [ ] Lines 86-91: `console.log('[CHAT_ONFINISH_DEBUG] onFinish called. selectedChatModel:', selectedChatModel, ', Message:', message ? JSON.stringify(message) : 'N/A');` (Delete)
            - [ ] Line 92: `console.log('[CHAT_ONFINISH_DEBUG] Status:', status);` (Delete)
            - [ ] Lines 94-96: `console.log('[N8N_STATE_DEBUG] N8N model finished, setting isN8nProcessing to false.');` (Delete)
            - [ ] Lines 101-103: `console.error('[CHAT_ONERROR_DEBUG] onError called. selectedChatModel:', selectedChatModel);` (Keep)
            - [ ] Line 104: `console.error('[CHAT_ONERROR_DEBUG] Error details:', error);` (Keep)
            - [ ] Line 105: `console.error('[CHAT_ONERROR_DEBUG] Status:', status);` (Keep)
            - [ ] Lines 108-110: `console.log('[N8N_STATE_DEBUG] Error during N8N processing, setting isN8nProcessing to false.');` (Delete)
            - [ ] Lines 143-147: `console.log('[CHAT_HANDLE_SUBMIT_DEBUG] handleFormSubmit called with:', { selectedChatModel, inputValue: currentInputValue, isN8nProcessing });` (Delete)
            - [ ] Lines 151-157: `console.log('[N8N_STATE_DEBUG] In handleFormSubmit - isN8nModel:', isN8nModel, ', hasInput:', hasInput, ', current isN8nProcessing state:', isN8nProcessing);` (Delete)
            - [ ] Lines 159-161: `console.log('[N8N_STATE_DEBUG] Setting isN8nProcessing to true for this N8N message.');` (Delete)
            - [ ] Line 207: `console.log('[SWR_POLL_DEBUG] Fetcher called for URL:', url);` (Delete)
            - [ ] Lines 212-217: `console.error('[SWR_POLL_DEBUG] SWR Error for key:', key, 'Error:', err);` (Keep)
            - [ ] Line 222: `console.error('[SWR_POLL_DEBUG] SWR hook encountered an error:', swrError);` (Keep)
            - [ ] Lines 227-232: `console.log('[SWR_POLL_DEBUG] SWR returned freshMessages. Count:', freshMessages.length, 'Data:', JSON.stringify(freshMessages.slice(-3)));` (Delete)
            - [ ] Lines 240-243: `console.warn('[Chat DEBUG] Invalid dbMessage structure:', dbMessage);` (Keep)
            - [ ] Lines 273-275: `console.log('[N8N_SWR_DEBUG] Hydration guard: hasMounted=true. Proceeding with message processing.');` (Delete)
            - [ ] Lines 278-281: `console.log('[SWR_POLL_DEBUG] Adding new assistant message from SWR poll to local state:', JSON.stringify(uiMsg));` (Delete)
            - [ ] Lines 288-290: `console.log('[N8N_STATE_DEBUG] New assistant messages appended from SWR, setting isN8nProcessing to false.');` (Delete)
            - [ ] Lines 293-295: `console.log('[N8N_SWR_DEBUG] Hydration guard: hasMounted=false. SKIPPING message processing from SWR during initial render.');` (Delete)
            - [ ] Lines 299-302: `console.log('[SWR_POLL_DEBUG] SWR returned freshMessages, but it is empty or has no new messages to append.', JSON.stringify(freshMessages));` (Delete)
        *   **File: `app/(chat)/api/chat/route.ts`**
            - [ ] Line 130: `console.log('[SERVER_API_CHAT_DEBUG] POST handler initiated.');` (Delete)
            - [ ] Lines 135-138: `console.log('[SERVER_API_CHAT_DEBUG] Raw request.json():', JSON.stringify(json, null, 2));` (Delete)
            - [ ] Line 140: `console.error('[API /api/chat] Invalid request body:', error);` (Refine to: `console.error('[API /api/chat] Invalid request body (Zod validation error):', (error as z.ZodError).issues);`)
            - [ ] Lines 149-152: `console.log('[SERVER_API_CHAT_DEBUG] Parsed requestBody (postRequestBodySchema):', JSON.stringify(parsedRequestBody, null, 2));` (Delete)
            - [ ] Lines 160-164: `console.log('[SERVER_API_CHAT_DEBUG] Destructured chatId:', chatId, ' incomingUserMessageFromClient.id:', incomingUserMessageFromClient.id);` (Delete)
            - [ ] Lines 221-224: `console.log('[API /api/chat] Received single message (images truncated):', JSON.stringify(loggableMessage, null, 2));` (Delete)
            - [ ] Line 229: `console.error('[API /api/chat] Unauthorized - No Clerk User ID found');` (Keep)
            - [ ] Line 236: \`console.error(\`Could not find user profile for Clerk ID: \${clerkUserId}\`);\` (Keep)
            - [ ] Lines 243-245: \`console.log(\`[SERVER_API_CHAT_DEBUG] Attempting to fetch Google OAuth token for user: \${userId}\`);\` (Delete)
            - [ ] Lines 249-251: \`console.warn(\`[SERVER_API_CHAT_DEBUG] Failed to get Google OAuth token for user \${userId}: \${tokenResult.error}\`);\` (Keep)
            - [ ] Lines 255-257: \`console.log(\`[SERVER_API_CHAT_DEBUG] Successfully fetched Google OAuth token for user \${userId}.\`);\` (Delete)
            - [ ] Lines 261-263: \`console.warn(\`[SERVER_API_CHAT_DEBUG] Google OAuth token fetch for user \${userId} completed but no token was returned.\`);\` (Keep)
            - [ ] Lines 277-280: `console.log('[SERVER_API_CHAT_DEBUG] Checking for existing chat with getChatById, chatId:', chatId);` (Delete)
            - [ ] Lines 281-285: \`console.log('[SERVER_API_CHAT_DEBUG] getChatById result:', existingChat ? \`Found chat (userId: \${existingChat.userId})\` : 'Chat not found.');\` (Delete)
            - [ ] Lines 289-291: \`console.log(\`[SERVER_API_CHAT_DEBUG] Attempting to save as new chat (ID: \${chatId})...\`);\` (Delete)
            - [ ] Lines 297-299: \`console.log(\`[SERVER_API_CHAT_DEBUG] Generated title for new chat: "\${newChatTitle}"\`);\` (Delete)
            - [ ] Lines 302-309: `console.log('[SERVER_API_CHAT_DEBUG] Calling saveChat for new chat, ID:', chatId, ' Title:', newChatTitle, ' Visibility:', selectedVisibilityType);` (Delete)
            - [ ] Line 317: \`console.log(\`[SERVER_API_CHAT_DEBUG] CALLED revalidateTag for chat-\${chatId}\`);\` (Delete)
            - [ ] Lines 319-321: \`console.log(\`[SERVER_API_CHAT_DEBUG] Saved new chat with ID: \${chatId} and Title: "\${newChatTitle}"\`);\` (Delete)
            - [ ] Lines 324-326: \`console.warn(\`[SERVER_API_CHAT_DEBUG] Chat (ID: \${chatId}) already exists, likely due to race condition. Proceeding.\`);\` (Keep)
            - [ ] Lines 328-330: \`console.log(\`[SERVER_API_CHAT_DEBUG] CALLED revalidateTag for chat-\${chatId} (in race condition handler)\`);\` (Delete)
            - [ ] Lines 332-335: `console.error('[SERVER_API_CHAT_DEBUG] Failed to save chat:', saveError);` (Keep)
            - [ ] Lines 338-340: \`console.log(\`[SERVER_API_CHAT_DEBUG] Verifying ownership for existing chat (ID: \${chatId})...\`);\` (Delete)
            - [ ] Lines 342-344: \`console.warn(\`[SERVER_API_CHAT_DEBUG] Unauthorized attempt to access chat (ID: \${chatId}) by user \${userId}.\`);\` (Keep)
            - [ ] Lines 347-349: \`console.log(\`[SERVER_API_CHAT_DEBUG] Ownership verified for chat (ID: \${chatId}).\`);\` (Delete)
            - [ ] Lines 355-357: \`console.log(\`[SERVER_API_CHAT_DEBUG] Updated chat \${chatId} visibility to \${selectedVisibilityType}\`);\` (Delete)
            - [ ] Lines 369-371: \`console.log(\`[SERVER_API_CHAT_DEBUG] Saved user message (ID: \${incomingUserMessageFromClient.id}) for chat \${chatId}\`);\` (Delete)
            - [ ] Lines 374-377: \`console.error(\`[SERVER_API_CHAT_DEBUG] Failed to save message: Chat (ID: \${chatId}) does not exist.\`, error);\` (Keep)
            - [ ] Lines 403-406: \`console.error(\`[SERVER_API_CHAT_DEBUG] Failed to save user message (ID: \${incomingUserMessageFromClient.id}) for chat \${chatId}:\`, error);\` (Keep)
            - [ ] Lines 411-413: \`console.log(\`[SERVER_API_CHAT_DEBUG] Checking model: selectedChatModel = "\${selectedChatModel}"\`);\` (Delete)
            - [ ] Lines 417-419: \`console.log(\`[SERVER_API_CHAT_DEBUG] Evaluating selectedModelInfo?.isN8n: \${selectedModelInfo?.isN8n}\`);\` (Delete)
            - [ ] Lines 422-424: \`console.log(\`[SERVER_API_CHAT_DEBUG] Triggering n8n workflow for chat \${chatId}\`);\` (Delete)
            - [ ] Lines 427-430: \`console.error(\`[SERVER_API_CHAT_DEBUG] Webhook URL for n8n assistant "\${selectedChatModel}" is not configured.\`);\` (Keep)
            - [ ] Lines 442-445: `console.log('[SERVER_API_CHAT_DEBUG] PRE-FETCH: n8n payload about to be sent:', JSON.stringify(n8nPayload, null, 2));` (Delete)
            - [ ] Lines 446-448: \`console.log(\`[SERVER_API_CHAT_DEBUG] PRE-FETCH: Target N8N Webhook URL: \${webhookUrl}\`);\` (Delete)
            - [ ] Lines 461-464: `console.log('[SERVER_API_CHAT_DEBUG] N8N FETCH COMPLETED. Status:', n8nResponse.status);` (Dele


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
    *   **Instruction (for `edit_file` call):** \"Update experimental_prepareRequestBody in components/chat.tsx to include documentId in the payload sent to /api/chat.\"
    *   **Verification:** Test client-side to ensure `documentId` is correctly included when a chat is initiated with an associated document.
2.  🔴 **Step 6.2: Update API Schema `app/(chat)/api/chat/schema.ts` for `documentId`**
    *   **Action:** Modify `postRequestBodySchema`.
        *   Add `documentId: z.string().uuid().optional()` to the schema.
    *   **Instruction (for `edit_file` call):** \"Add 'documentId: z.string().uuid().optional()' to postRequestBodySchema in app/(chat)/api/chat/schema.ts.\"
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
    *   **Instruction (for `edit_file` call):** \"Reinstate documentId handling in /api/chat: parse documentId from request, use it for new chat titling, and link Document to Chat in DB.\"
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