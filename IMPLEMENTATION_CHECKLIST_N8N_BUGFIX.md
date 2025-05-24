# N8N Bugfix: `experimental_prepareRequestBody` Implementation Checklist

**Overall Goal:** Resolve the N8N bug where it responds to the wrong user message and to prevent duplicate N8N webhook invocations. This will be achieved by aligning client-side message sending and server-side message handling with the Vercel AI Chatbot template, primarily by using `experimental_prepareRequestBody` in `useChat` to send only the latest user message to the backend, and adjusting the backend to reconstruct message history.

**Assistant Instructions for Executing this Checklist:**
*   Update the status emoji for each item **as you start it** (🟡) and **when you complete it successfully** (🟢).
*   If any step **fails or cannot be completed as described**, mark it with ⚠️ and **STOP IMMEDIATELY**. Do not proceed to the next step. Await further instructions from the user.
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

1.  🟡 **User Confirmation:** User to confirm they have a backup/commit of `components/chat.tsx`, `app/(chat)/api/chat/route.ts`, and `app/(chat)/api/chat/schema.ts` (if it exists) before live edits begin.
    *   *Assistant Note: This is a user action. Mark 🟢 when user confirms.*
2.  🟡 **Final Checklist Review (User):** User to review this entire checklist for completeness, correctness, and adherence to instructions.
    *   *Assistant Note: Await user approval of this checklist document before proceeding to Phase 1.*

---
## Phase 1: Client-Side Changes in `components/chat.tsx`
---

**Objective:** Modify `components/chat.tsx` to use `experimental_prepareRequestBody` directly within `useChat` options, sending only the latest user message and required identifiers to the backend. Preserve N8N-specific processing logic (`isN8nProcessing` state, SWR polling).

1.  🔴 **Step 1.1: Fetch LATEST Vercel AI SDK Documentation (useChat & experimental_prepareRequestBody)**
    *   **Action:** Use Context7 MCP to get the latest documentation for `/vercel/ai` focusing on `useChat` and specifically `experimental_prepareRequestBody`.
    *   **Purpose:** Ensure all subsequent client-side changes are based on the most current SDK patterns.
    *   **Verification:** Review returned documentation snippets for argument structure, return types, and example usage of `experimental_prepareRequestBody`.
2.  🔴 **Step 1.2: Fetch LATEST Vercel Template `components/chat.tsx`**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/components/chat.tsx`
    *   **Purpose:** Obtain the most recent reference implementation from the official template.
    *   **Verification:** Briefly scan the fetched file for `useChat` and `experimental_prepareRequestBody` usage to have a direct comparison point.
3.  🔴 **Step 1.3: Read Current Project `components/chat.tsx`**
    *   **Action:** Read the full content of the project's current `components/chat.tsx` (at commit `1b1f7e8`).
    *   **Purpose:** Load the current code into context for accurate diff generation.
4.  🔴 **Step 1.4: Plan `handleSubmitIntercept` Removal and `useChat` Modification**
    *   **Action:** Identify the exact lines of `handleSubmitIntercept` to be removed.
    *   **Action:** Identify where `experimental_prepareRequestBody` will be added within the `useChat` options object.
    *   **Action:** Confirm that the `body: { id, selectedChatModel: selectedChatModel }` line in current `useChat` options will be removed.
5.  🔴 **Step 1.5: Design the `experimental_prepareRequestBody` Function Structure**
    *   **Action:** Based on Vercel template (`schema.ts` previously fetched) and SDK docs (Step 1.1), define the exact structure of the object to be returned by `experimental_prepareRequestBody`. This payload should be:
        ```typescript
        {
          id: string, // chat ID
          message: { // single message object
            id: string,
            createdAt: Date,
            role: 'user',
            content: string,
            parts: Array<{ type: 'text', text: string }>, // Ensure this structure
            experimental_attachments?: Array<Attachment>
          },
          selectedChatModel: string,
          // selectedVisibilityType: string // (if we decide to include based on template)
        }
        ```
    *   **Action:** Ensure the `latestMessage.parts` are correctly constructed if `latestMessage.content` exists but `latestMessage.parts` might be undefined (e.g., `parts: latestMessage.parts || [{ type: 'text', text: latestMessage.content }]`).
    *   **Action:** Add detailed `console.log` statements inside this function to log the input `body` from `useChat` and the final `payload` being returned.
6.  🔴 **Step 1.6: Plan `isN8nProcessing` Logic Adaptation**
    *   **Action:** Design the wrapper function `handleFormSubmit` that will be passed to `MultimodalInput`. This wrapper will:
        1.  Check if `selectedChatModel === 'n8n-assistant'`.
        2.  Check if it's a new user message submission (e.g., by verifying `input.trim() !== ''`).
        3.  If both are true and `!isN8nProcessing`, call `setIsN8nProcessing(true)`.
        4.  Call the original `handleSubmit` from `useChat` with the provided arguments.
    *   **Verification:** Ensure existing logic for setting `isN8nProcessing` to `false` in `onFinish` (for non-N8N success) and `onError` (for N8N errors) remains or is correctly adapted.
7.  🔴 **Step 1.7: Prepare `edit_file` for `components/chat.tsx`**
    *   **Action:** Construct the `code_edit` string for `components/chat.tsx` incorporating all changes from Steps 1.4, 1.5, and 1.6.
        *   Remove `handleSubmitIntercept`.
        *   Modify `useChat` options:
            *   Remove `body: { id, selectedChatModel }`.
            *   Rename `handleSubmit: originalUseChatHandleSubmit` to `handleSubmit`.
            *   Add the new `experimental_prepareRequestBody` function.
        *   Add the `handleFormSubmit` wrapper function.
        *   Update the `handleSubmit` prop for `MultimodalInput` to use `handleFormSubmit`.
        *   Ensure all N8N-related state (`isN8nProcessing`), SWR polling, and `useEffect` for polled messages are preserved and correctly integrated.
    *   **Instruction:** The `instructions` field for `edit_file` should be: "Implement experimental_prepareRequestBody in useChat, remove handleSubmitIntercept, and adapt N8N logic by wrapping handleSubmit."
8.  🔴 **Step 1.8: Execute `edit_file` for `components/chat.tsx`**
    *   **Action:** Call `edit_file` with the prepared arguments.
9.  🔴 **Step 1.9: Review Diff and Verify Changes in `components/chat.tsx`**
    *   **Action:** Carefully review the diff output from the `edit_file` call.
    *   **Verification:**
        *   Confirm `handleSubmitIntercept` is gone.
        *   Confirm `experimental_prepareRequestBody` is correctly added to `useChat` with the right payload structure and logging.
        *   Confirm `body` option is removed from `useChat`.
        *   Confirm `handleFormSubmit` wrapper is present and correctly calls `setIsN8nProcessing` and the original `handleSubmit`.
        *   Confirm `MultimodalInput` uses `handleFormSubmit`.
        *   Confirm no other critical logic (especially SWR, other `useEffect` hooks, `isN8nProcessing` in `onFinish`/`onError`) was accidentally removed or broken. Cross-reference with `TEMPLATE_FEATURE_DIFFERENCES.md` to ensure no desired template features were inadvertently removed if they were previously implemented.
10. 🔴 **Step 1.10: Run Linter/Type-Checker for `components/chat.tsx`**
    *   **Action:** Propose a terminal command: `pnpm lint:fix` (or equivalent type-checking command like `pnpm typecheck`).
    *   **Purpose:** Catch any syntax errors, type errors, or linting issues introduced by the changes.
    *   **Verification:** Confirm command executes successfully and no new errors related to the changes are reported. If errors occur, analyze and propose fixes in a sub-step.

---
## Phase 2: Server-Side Schema `app/(chat)/api/chat/schema.ts`
---

**Objective:** Ensure a Zod schema exists at `app/(chat)/api/chat/schema.ts` that validates the new request body structure (singular `message` object with `id`, `createdAt`, `role`, `content`, `parts`, `experimental_attachments`) along with `id` (chatId), `selectedChatModel`, and `selectedVisibilityType`, as expected by the `/api/chat` POST endpoint, aligning with the Vercel template.

**Directory Context:** The schema file is located at `app/(chat)/api/chat/schema.ts`.

**Key Schema Elements to Define/Verify:**
*   **`textPartSchema`**: `z.object({ text: z.string().min(1).max(2000), type: z.enum(['text']) })`
*   **`postRequestBodySchema`**: A Zod object to validate the entire request body.
    *   `id`: `z.string().uuid()` (This is the Chat ID).
    *   `message`: `z.object({ ... })` (The single, new user message).
        *   `id`: `z.string().uuid()` (ID of the message itself).
        *   `createdAt`: `z.coerce.date()` (Timestamp of message creation).
        *   `role`: `z.enum(['user'])` (Role must be 'user').
        *   `content`: `z.string().min(1).max(2000)` (The text content of the message).
        *   `parts`: `z.array(textPartSchema)` (Ensures content is structured as parts; can be derived from `content` if not directly provided, e.g., `[{ type: 'text', text: message.content }]`).
        *   `experimental_attachments`: `z.array(z.object({...})).optional()` (Schema for attachments, if used).
    *   `selectedChatModel`: `z.enum([...])` (e.g., `['chat-model', 'chat-model-reasoning', 'n8n-assistant']` - should reflect models available in *this* project).
    *   `selectedVisibilityType`: `z.enum(['public', 'private'])`.
*   **`PostRequestBody` Type Export**: `export type PostRequestBody = z.infer<typeof postRequestBodySchema>;`

**Checklist:**

1.  🔴 **Step 2.1: Fetch LATEST Vercel Template `schema.ts` (AGAIN, for direct reference)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/app/\(chat\)/api/chat/schema.ts`
    *   **Purpose:** Get the most up-to-date definitive schema structure from the Vercel template.
    *   **Verification:** Confirm the structure of `postRequestBodySchema`, especially the singular `message` object and its fields (`id`, `createdAt`, `role`, `content`, `parts`), and the top-level `id` (chatId), `selectedChatModel`, `selectedVisibilityType`.
2.  🔴 **Step 2.2: Check for Existing Project `schema.ts` and Read if Present**
    *   **Action (List Directory):** Use `list_dir` for `app/(chat)/api/chat/` to confirm if `schema.ts` exists.
    *   **Action (Read File if Exists):** If `schema.ts` exists, read its full content using `read_file`.
    *   **Purpose:** Understand the current state of the project's schema file, if any.
3.  🔴 **Step 2.3: Plan `schema.ts` Creation or Modification**
    *   **Action (If `schema.ts` does NOT exist OR is vastly different):**
        *   Plan to create/overwrite `app/(chat)/api/chat/schema.ts`.
        *   The content should be based *directly* on the Vercel template's `schema.ts` (fetched in Step 2.1).
        *   **Crucially, adapt the `selectedChatModel` enum to include all models relevant to *this* project (e.g., add `'n8n-assistant'`).**
        *   Ensure it exports `postRequestBodySchema` and the `PostRequestBody` type.
    *   **Action (If `schema.ts` EXISTS and is similar):**
        *   Compare its `postRequestBodySchema` with the Vercel template's schema (Step 2.1).
        *   Plan modifications to align it precisely:
            *   Ensure the top-level `id` (chatId) is present.
            *   Ensure the `message` field is singular and its object structure (`id`, `createdAt`, `role`, `content`, `parts`, `experimental_attachments`) matches the template.
            *   Ensure `selectedChatModel` enum is correct for *this* project.
            *   Ensure `selectedVisibilityType` is present and correct.
4.  🔴 **Step 2.4: Prepare `edit_file` for `app/(chat)/api/chat/schema.ts`**
    *   **Action:** Construct the `code_edit` string.
        *   If creating/overwriting: the `code_edit` will be the full content derived from the template schema (Step 2.1), with the `selectedChatModel` enum adapted.
        *   If modifying: the `code_edit` will be a diff to align the existing file.
    *   **Instruction (for `edit_file` call):** "Create/Update app/(chat)/api/chat/schema.ts to align with Vercel template: validate top-level 'id' (chatId), a singular 'message' object (with 'id', 'createdAt', 'role', 'content', 'parts'), 'selectedChatModel' (adapted for this project), and 'selectedVisibilityType'."
5.  🔴 **Step 2.5: Execute `edit_file` for `app/(chat)/api/chat/schema.ts`**
    *   **Action:** Call `edit_file` with the prepared arguments.
6.  🔴 **Step 2.6: Review Diff/Content and Verify `schema.ts`**
    *   **Action:** Carefully review the diff output or the full file content if newly created.
    *   **Verification:**
        *   Confirm `postRequestBodySchema` is correctly defined in `app/(chat)/api/chat/schema.ts`.
        *   Verify it includes: `id` (string, for chatId), `message` (object, for the single message, with fields `id`, `createdAt`, `role`, `content`, `parts`), `selectedChatModel` (enum, adapted for this project's models including 'n8n-assistant'), and `selectedVisibilityType`.
        *   Confirm `PostRequestBody` type is exported.
        *   Confirm `textPartSchema` is defined and used in `message.parts`.

---
## Phase 3: Server-Side API Route `app/(chat)/api/chat/route.ts`
---

**Objective:** Adapt the `POST` handler in `app/(chat)/api/chat/route.ts` to:
1.  Correctly parse the new request body (now containing a single `message` object) using the updated `schema.ts`.
2.  Fetch previous messages from the database.
3.  Reconstruct the full message history to be used by AI models.
4.  Ensure the N8N payload is correctly constructed using the single incoming message and the fetched history.
5.  Correctly save the new user message to the database.

**Directory Context:** The API route file is located at `app/(chat)/api/chat/route.ts`.

**Key Logic Flow Changes in `POST` Handler:**
*   **Request Parsing:**
    *   `const json = await request.json();`
    *   `const requestBody = postRequestBodySchema.parse(json);` (Import `postRequestBodySchema` from `./schema`).
    *   `const { id: chatId, message: newSingleUserMessage, selectedChatModel /*, selectedVisibilityType */ } = requestBody;`
*   **History Reconstruction:**
    *   `const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });` (Ensure `getMessagesByChatId` returns messages in a format compatible with `appendClientMessage` or plan for transformation).
    *   `const fullMessagesForAI = appendClientMessage({ messages: previousMessagesFromDB, message: newSingleUserMessage });` (Import `appendClientMessage` from `ai` SDK).
*   **N8N Payload (Conceptual):**
    *   `const userMessageContentForN8N = newSingleUserMessage.content;`
    *   `const historyForN8N = formatMessagesForN8N(previousMessagesFromDB);` (Adapt existing history formatting logic).
*   **Saving User Message:**
    *   The object to save needs `chatId`. `newSingleUserMessage` (from `requestBody.message`) does NOT contain `chatId`.
    *   Construct the message to save:
        ```typescript
        const userMessageToSave = {
          chatId: chatId, // from requestBody.id
          id: newSingleUserMessage.id,
          role: newSingleUserMessage.role, // should be 'user'
          content: newSingleUserMessage.content, // if parts is the source of truth, this might be derived or handled by saveMessages
          parts: newSingleUserMessage.parts, // ensure this is the primary content storage
          attachments: newSingleUserMessage.experimental_attachments ?? [],
          createdAt: newSingleUserMessage.createdAt || new Date(), // ensure createdAt is valid
        };
        await saveMessages({ messages: [userMessageToSave] });
        ```
*   **Passing to AI:** Use `fullMessagesForAI` for `streamText` or other AI calls.

**Checklist:**

1.  🔴 **Step 3.1: Fetch LATEST Vercel Template `route.ts` (CRITICAL RE-FETCH)**
    *   **Action:** `curl -s https://raw.githubusercontent.com/vercel/ai-chatbot/main/app/\(chat\)/api/chat/route.ts`
    *   **Purpose:** This is the most critical reference for the server-side logic changes, especially how the template parses the new body, fetches history, and reconstructs the `messages` array for the AI.
    *   **Verification:** Pay close attention to:
        *   Import of `postRequestBodySchema` from `./schema`.
        *   Usage: `requestBody = postRequestBodySchema.parse(json)`.
        *   Destructuring: `{ id, message, selectedChatModel, selectedVisibilityType } = requestBody`.
        *   Fetching history: `previousMessages = await getMessagesByChatId({ id })`.
        *   Reconstructing messages: `messages = appendClientMessage({ messages: previousMessages, message })`.
        *   How `saveMessages` is called for the incoming user message (it constructs the object to save, adding `chatId`).
2.  🔴 **Step 3.2: Fetch LATEST Vercel AI SDK Documentation (Server-Side Utilities)**
    *   **Action:** Use Context7 MCP for `/vercel/ai`. Topics: `appendClientMessage`, `streamText`, general server-side message handling, `UIMessage` vs. DB message types.
    *   **Purpose:** Ensure correct usage and understanding of `appendClientMessage` and any type conversions needed between DB message format and `UIMessage` format expected by SDK utilities.
    *   **Verification:** Check the signature of `appendClientMessage`. Does it expect `UIMessage[]` for `messages` and `UIMessage` for `message`? What does `getMessagesByChatId` return? Is a map/transform needed for `previousMessagesFromDB` before passing to `appendClientMessage`? (The template has `@ts-expect-error` suggesting a potential type mismatch it handles).
3.  🔴 **Step 3.3: Read Current Project `app/(chat)/api/chat/route.ts`**
    *   **Action:** Read the full content of the project's current `app/(chat)/api/chat/route.ts`.
    *   **Purpose:** Load current server-side logic into context for accurate diff generation.
4.  🔴 **Step 3.4: Plan Request Body Parsing Adaptation**
    *   **Action:**
        *   Add `import { postRequestBodySchema } from './schema';`
        *   Modify the start of the `POST` handler to parse the request using this schema:
            ```typescript
            // const { messages: clientMessages, id: chatId, selectedChatModel } = await req.json(); // OLD
            let requestBody; // Or PostRequestBody type
            try {
              const json = await request.json();
              requestBody = postRequestBodySchema.parse(json);
            } catch (error) {
              // Handle Zod validation error, e.g., return 400
              return new Response(JSON.stringify({ error: 'Bad Request', details: error }), { status: 400 });
            }
            const { id: chatId, message: newSingleUserMessage, selectedChatModel /*, selectedVisibilityType */ } = requestBody;
            ```
    *   **Verification:** Ensure existing error handling for JSON parsing is maintained or improved.
5.  🔴 **Step 3.5: Plan Message History Reconstruction**
    *   **Action:**
        *   Locate where `getMessagesByChatId` is (or would be) called. It should be *after* parsing `chatId` and *before* any AI/N8N calls.
        *   Plan the call: `const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });`
        *   Plan the history assembly: `const fullMessagesForAI = appendClientMessage({ messages: previousMessagesFromDB, message: newSingleUserMessage });` (Ensure `appendClientMessage` is imported from `ai`).
    *   **Action (Type Handling for `previousMessagesFromDB`):**
        *   Based on Step 3.2, if `getMessagesByChatId` returns a DB-specific type and `appendClientMessage` needs `UIMessage[]`, plan a mapping function or an inline map. Example:
            ```typescript
            // Assuming previousMessagesFromDB is DBMessage[] and needs conversion to UIMessage[]
            // const uiPreviousMessages = previousMessagesFromDB.map(dbMsg => ({ /* map fields */ id: dbMsg.id, role: dbMsg.role, content: dbMsg.content, ...etc. }) as UIMessage);
            // const fullMessagesForAI = appendClientMessage({ messages: uiPreviousMessages, message: newSingleUserMessage });
            ```
            The Vercel template itself has a `@ts-expect-error` here, implying they might do a direct pass-through and rely on structural compatibility or a runtime conversion within `appendClientMessage`. We should aim for type safety if possible, or acknowledge the pattern from the template.
6.  🔴 **Step 3.6: Plan N8N Payload Construction (Maintaining Current Logic with New Variables)**
    *   **Action:**
        *   Locate existing N8N payload logic (e.g., `getMostRecentUserMessage`, `getHistoryExcludingLastUserMessage`, `formatMessagesForN8N`).
        *   Adapt to use `newSingleUserMessage` and `previousMessagesFromDB`.
        *   The `userMessageContent` for N8N should now come directly from `newSingleUserMessage.content`.
        *   The `history` for N8N should be constructed from `previousMessagesFromDB`. The existing utility `getHistoryExcludingLastUserMessage` might be reusable if `previousMessagesFromDB` is in the right format, or a new/adapted formatting function might be needed.
        *   The core logic should be:
            ```typescript
            const userMessageContentForN8N = newSingleUserMessage.content;
            // Assuming previousMessagesFromDB might need formatting/conversion to the type formatMessagesForN8N expects
            const historyForN8N = formatMessagesForN8N(previousMessagesFromDB); // or map previousMessagesFromDB first
            ```
    *   **Verification:** Ensure N8N still receives the current user message content distinctly from the historical messages, as per its designed workflow.
7.  🔴 **Step 3.7: Plan Database `saveMessages` Call for User Message**
    *   **Action:**
        *   Locate the `await saveMessages(...)` call for the incoming user message.
        *   Modify it to save the `newSingleUserMessage`, ensuring `chatId` is included in the object being saved, as the template does.
            ```typescript
            const userMessageToSave = {
              chatId: chatId, // This is crucial
              id: newSingleUserMessage.id,
              role: newSingleUserMessage.role as 'user', // Ensure role is correctly typed for DB
              content: newSingleUserMessage.content,    // Or handle 'parts' as primary
              parts: newSingleUserMessage.parts,        // If 'parts' is the source of truth for content
              attachments: newSingleUserMessage.experimental_attachments ?? [],
              createdAt: newSingleUserMessage.createdAt || new Date(),
            };
            await saveMessages({ messages: [userMessageToSave] });
            ```
    *   **Verification:** Confirm the structure passed to `saveMessages` matches what the DB query expects.
8.  🔴 **Step 3.8: Plan AI Call Adaptation (e.g., `streamText`)**
    *   **Action:** Locate the call to `streamText` (or equivalent for non-streaming N8N path).
    *   **Action:** Ensure the `messages` property in its options now uses `fullMessagesForAI` (the reconstructed complete history including the latest user message).
9.  🔴 **Step 3.9: Prepare `edit_file` for `app/(chat)/api/chat/route.ts`**
    *   **Action:** Construct the `code_edit` string incorporating all changes planned in Steps 3.4 through 3.8.
        *   Import `postRequestBodySchema`.
        *   Update request parsing.
        *   Add fetching of `previousMessagesFromDB`.
        *   Add assembly of `fullMessagesForAI` using `appendClientMessage`.
        *   Adapt N8N payload creation.
        *   Adapt `saveMessages` for the user message.
        *   Ensure AI calls use `fullMessagesForAI`.
        *   Maintain existing logic for creating/finding chat, auth, rate limiting, etc.
    *   **Instruction (for `edit_file` call):** "Adapt /api/chat POST route: use schema for single 'message' body, reconstruct history with getMessagesByChatId & appendClientMessage, ensure N8N payload uses new variables, correctly save user message with chatId, and pass full history to AI."
10. 🔴 **Step 3.10: Execute `edit_file` for `app/(chat)/api/chat/route.ts`**
    *   **Action:** Call `edit_file` with the prepared arguments.
11. 🔴 **Step 3.11: Review Diff and Verify Changes in `app/(chat)/api/chat/route.ts`**
    *   **Action:** Carefully review the diff output from the `edit_file` call.
    *   **Verification (CRITICAL):**
        *   Confirm import and use of `postRequestBodySchema`.
        *   Confirm `chatId`, `newSingleUserMessage`, `selectedChatModel` are correctly destructured.
        *   Confirm `previousMessagesFromDB` are fetched.
        *   Confirm `fullMessagesForAI` are assembled using `appendClientMessage` with potentially mapped `previousMessagesFromDB`.
        *   Confirm N8N payload (`userMessageForN8N`, `historyForN8N`) is derived correctly from `newSingleUserMessage` and `previousMessagesFromDB`.
        *   Confirm `saveMessages` saves the user message with `chatId` correctly embedded in the message object.
        *   Confirm `streamText` (or N8N path) uses `fullMessagesForAI`.
        *   Confirm no other logic (auth, chat creation, rate limits, saving assistant messages) was inadvertently broken.
12. 🔴 **Step 3.12: Run Linter/Type-Checker for `app/(chat)/api/chat/route.ts`**
    *   **Action:** Propose a terminal command: `pnpm lint:fix` (or `pnpm typecheck`).
    *   **Verification:** Confirm command executes successfully and no new errors related to the changes are reported. If errors occur, analyze and propose fixes in a sub-step.

---
## Phase 4: Testing and Verification (After Deployment)
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
## Phase 5: Final Code Cleanup & Commit
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
**Checklist End.** 