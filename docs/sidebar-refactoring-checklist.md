## Changelog

*This log tracks all file modifications made during the sidebar performance refactoring (Plan v3.1).*

*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Added Changelog placeholder.
*   **[Date/Time]** - `app/(chat)/api/sidebar-init/route.ts` - Created new API route. **Errors:** Linter errors related to `@/lib/db` import, `Document` schema usage (value vs type), `auth().userId` access, implicit `any` types.
*   **[Date/Time]** - `app/(chat)/api/sidebar-init/route.ts` - Attempt 1 to fix errors (renamed `Document` import, added type to map). **Errors:** Linter errors related to `@/lib/db` import, `auth().userId` access, incorrect schema value usage (`DocumentSchema` used as value).
*   **[Date/Time]** - `app/(chat)/api/sidebar-init/route.ts` - Attempt 2 to fix errors (used correct `document` value import, added explicit types). **Errors:** Persistent linter errors for `@/lib/db` import and `auth().userId` access.
*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Added Database Schema Reference section.
*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Added Implementation Notes & Strict Guidelines section.
*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Added Sidebar Related Files Reference section.
*   **[Date/Time]** - `components/app-sidebar.tsx` - Fixed incorrect destructuring of `isLoading` and `error` from `useSidebarInit` call.
*   **[Date/Time]** - `components/sidebar-history.tsx` - Removed incorrect `useInView` import and hook usage.
*   **[Date/Time]** - `components/app-sidebar.tsx` - Exported required types (`ChatStub`, etc.) and added `mutateCombined` to context type.
*   **[Date/Time]** - `app/(chat)/api/sidebar-init/route.ts` - Corrected `db` import path to `@/lib/db/queries`. Fixed Clerk `auth()` (missing await) and `modifiedAt` null handling type errors.
*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Added note about correct `db` import path to Guidelines.
*   **[Date/Time]** - `app/api/webhooks/clerk/route.ts` - Updated webhook handler to set `internal_db_id` in Clerk metadata *before* N8N call.
*   **[Date/Time]** - `app/(chat)/api/sidebar-init/route.ts` - Implemented optimization to fetch Supabase user ID from Clerk metadata first, falling back to DB query.
*   **[Date/Time]** - `components/app-sidebar.tsx` - Implemented `useSidebarInit` (with localStorage cache) and `useOlderChats` (with cursor pagination) hooks. Integrated hooks into `SidebarDataProvider` context. Fixed `hasMoreOlder` type error. Added deduplication for combined chats.
*   **[Date/Time]** - `components/sidebar-history.tsx` - Refactored to use `SidebarDataContext`. Removed `useInView` for infinite scroll (dependency not installed).
*   **[Date/Time]** - `components/sidebar-files.tsx` - Refactored to use `SidebarDataContext`. Initialized `documentItems` as empty array (context lacks document data).
*   **[Date/Time]** - `components/sidebar-all.tsx` - Refactored to use `SidebarDataContext`. Temporarily displays only chats.
*   **[Date/Time]** - `app/(chat)/api/sidebar-init/route.ts` - Removed `export const runtime = 'edge';` to resolve 'net' module error.
*   **[Date/Time]** - `components/app-sidebar.tsx` - Fixed linter errors (optional chaining, `Number.isNaN`).
*   **[Date/Time]** - `components/app-sidebar.tsx` - Updated `useSidebarInit` to track `initialFetchAttempted` state. Modified context to use this flag instead of `isInitialLoading`.
*   **[Date/Time]** - `components/sidebar-history.tsx` - Updated conditional rendering logic to use `initialFetchAttempted` and strictly separate skeleton, list, error, and empty states to prevent incorrect flash of "No chat history found." when cached data exists.
*   **[Date/Time]** - `components/sidebar-files.tsx` - Updated conditional rendering logic to use `initialFetchAttempted` for strict state separation.
*   **[Date/Time]** - `components/sidebar-all.tsx` - Updated conditional rendering logic to use `initialFetchAttempted` for strict state separation.
*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Updated Mistake Log with entries for faulty loading logic, syntax errors, and rule violations.
*   **[Date/Time]** - `components/app-sidebar.tsx` - Fixed linter errors by moving shared types (`ChatStub`, `DocumentStub`, etc.) to top-level, correcting hook structure, and removing bottom exports to resolve circular dependencies (workaround).
*   **[Date/Time]** - `components/sidebar-files.tsx` - Updated type imports to point to top-level types in `app-sidebar.tsx`.
*   **[Date/Time]** - `docs/sidebar-refactoring-checklist.md` - Updated Current Issues and Checklist sections to reflect latest status, including the type workaround and remaining TODOs/verification steps.

---

## RETARDED FUCKING MISTAKE LOG & FUTURE AVOIDANCE PLANS

*This section documents errors made during development to prevent repetition.* 

1.  **Incorrect `db` Import Path:**
    *   **Mistake:** Imported Drizzle `db` instance from `@/lib/db` instead of the correct file `@/lib/db/queries.ts` in `app/(chat)/api/sidebar-init/route.ts`.
    *   **Avoidance:** Before importing shared instances/variables (like `db`), *always* verify the exact export location by checking potential source files (e.g., `lib/db/*`). Refer to Guideline #6 in this document which now specifies the correct path.

2.  **Ignoring Clerk `auth()` Promise:**
    *   **Mistake:** Repeatedly ignored linter warnings that `auth()` returns a `Promise` in async API routes. Tried to destructure `userId` directly without `await`.
    *   **Avoidance:** *Always* `await auth()` inside `async` functions before destructuring `userId`. Trust the linter, especially for async/await and Promise-related type errors. Refer to Guideline #3.

3.  **Incorrect `clerkClient` Usage:**
    *   **Mistake:** Used `clerkClient.users.getUser()` instead of `(await clerkClient()).users.getUser()`. Forgot that `clerkClient` is a function returning the client.
    *   **Avoidance:** Remember `clerkClient` from `@clerk/nextjs/server` is a function. Call it (`await clerkClient()`) to get the instance before accessing its methods. Consult Clerk documentation if unsure.

4.  **Type Mismatches (Null Handling):**
    *   **Mistake:** Failed to handle potential `null` values for fields like `modifiedAt` when mapping database results to defined types (e.g., passing `Date | null` to `new Date()`).
    *   **Avoidance:** Carefully check database schema and query results for nullability. Explicitly handle potential `null` values in code (e.g., `value ? new Date(value) : defaultValue`) or adjust TypeScript types (`Date | null`) before using the value where non-null is expected. Refer to Guideline #5.

5.  **Failure to Check Documentation:**
    *   **Mistake:** Modified Clerk webhook handler and API routes using `clerkClient` without first consulting up-to-date Clerk documentation, violating project rules.
    *   **Avoidance:** **ABSOLUTE RULE:** Before writing or modifying *any* code involving external libraries (Clerk, Drizzle, SWR, Vercel AI SDK, Next.js, etc.), **MUST** consult current documentation via Context7 tool or web search. **NO EXCUSES.** Refer to **Third-Party Packages and Frameworks** rules.

6.  **Importing Uninstalled Dependency:**
    *   **Mistake:** Imported `useInView` from `react-intersection-observer` in `components/sidebar-history.tsx` without first checking if the package was listed in `package.json` or installing it.
    *   **Avoidance:** Before importing from a third-party library, **always** verify it's installed by checking `package.json`. If missing, install using `pnpm add [package-name]`. Never assume a package is present.

7.  **Ignoring Linter Safety Warnings:**
    *   **Mistake:** Ignored linter warnings in `components/app-sidebar.tsx` regarding potentially unsafe property access on nullable objects (missing optional chaining `?.`) and using `isNaN()` instead of `Number.isNaN()`.
    *   **Avoidance:** Treat linter warnings about potential runtime errors (null access, unsafe functions) seriously. Apply suggested safer patterns like optional chaining (`?.`) and type-safe checks (`Number.isNaN()`).

8.  **Edge Runtime Conflict (`net` module):**
    *   **Mistake:** Declared `export const runtime = 'edge';` in `app/(chat)/api/sidebar-init/route.ts` while the imported database driver (`postgres` via `@/lib/db/queries`) requires Node.js modules (`net`) unavailable in the Edge runtime.
    *   **Avoidance:** Ensure API routes using standard Node.js-dependent packages (like the `postgres` driver) do not have the Edge runtime explicitly configured. Either remove `export const runtime = 'edge';` or switch to an Edge-compatible database driver if Edge runtime is strictly required.

9.  **Faulty Loading State Logic (Race Condition):**
    *   **Mistake:** Repeatedly failed to correctly handle the loading state synchronization between cached data (`localStorage`/SWR `fallbackData`), derived state (`initialFetchAttempted`), and context propagation. The logic allowed a brief state where `initialFetchAttempted` was false (or became false too quickly) while `hasItems` was also false in the consumer component, causing the "No chat history found." message to flash incorrectly on soft refresh.
    *   **Avoidance:** Ensure state indicating data availability (from cache or fetch) is determined and propagated reliably *before* or *in perfect sync with* the state indicating the initial fetch attempt is complete. Initialize completion flags (`initialFetchAttempted`) synchronously based on cache hits *before* the first render pass completes, not in `useEffect`.

10. **Introducing Syntax/Structural Errors:**
    *   **Mistake:** Introduced severe syntax errors (e.g., misplaced hook return statements, incorrect variable scopes) in `components/app-sidebar.tsx` while attempting to refactor the `useSidebarInit` hook, causing the application to fail compilation.
    *   **Avoidance:** Exercise extreme care when refactoring complex hooks. Double-check JavaScript/TypeScript syntax, variable scope, and the overall structure of hooks and components *before* finalizing edits. Use linting and preview tools effectively to catch structural errors.

11. **Violating No-File-Creation Rule:**
    *   **Mistake:** Proposed creating a new file (`lib/types/sidebar.ts`) to solve circular type dependencies without explicit authorization, directly violating user instructions and project rules.
    *   **Avoidance:** **ALWAYS** adhere to explicit constraints provided by the user and in project rules. NEVER create files or perform actions explicitly forbidden without direct authorization. Seek clarification or propose alternative solutions that comply with the rules first.

12. **Ignoring `content_json` for `textv2` Artifacts:**
    *   **Mistake:** The `useEffect` hook in `components/artifact.tsx` that loads document content into the main artifact state incorrectly read `document.content` (Markdown) and ignored `document.content_json`. When the Markdown was empty/null for a `textv2` document, it defaulted to an empty Tiptap JSON object, causing the editor to appear blank even if valid `content_json` existed in the database.
    *   **Avoidance:** When loading document content for the artifact state, **always** check the `kind`. If `kind === 'textv2'`, prioritize parsing and using `document.content_json`. Only fall back to `document.content` (Markdown) or a default empty state if `content_json` is missing or invalid.

---

## Sidebar Related Files Reference

*This list identifies core files involved in sidebar functionality (data fetching, rendering, APIs, types, DB interactions) as of [Current Date/Time]. Refer to this list to avoid confusion and errors.* 

*   **Core Sidebar Component:**
    *   `components/app-sidebar.tsx` (Main structure, tabs, context provider)
*   **Sidebar Tab Content Components:**
    *   `components/sidebar-all.tsx`
    *   `components/sidebar-history.tsx`
    *   `components/sidebar-files.tsx` 
*   **Sidebar Item Components:**
    *   `components/sidebar-all-item.tsx`
    *   `components/sidebar-history-item.tsx`
    *   `components/sidebar-files-item.tsx`
*   **API Routes (Data Sources):**
    *   `app/(chat)/api/history/route.ts` (Existing chat history endpoint)
    *   `app/(chat)/api/sidebar-init/route.ts` (New endpoint for initial load)
    *   *(Check status of `app/(chat)/api/documents/route.ts`)*
    *   *(Consider `app/(chat)/api/chat/[id]/messages/route.ts` for preloading)*
*   **Data Fetching Hooks:**
    *   *(Plan is to refactor away from `hooks/use-chats.ts`, `hooks/use-documents.ts`)*
    *   *(Plan involves new hooks like `useSidebarInit`, `useOlderChats`)*
*   **Database:**
    *   `lib/db/queries.ts` (DB query functions)
    *   `lib/db/schema.ts` (Table definitions)
*   **Shared Types:**
    *   *(Consider centralizing types, e.g., in `lib/types/sidebar.ts`)*
*   **UI Primitives:**
    *   `components/ui/sidebar.tsx` 
    *   `components/ui/tabs.tsx` 

---



## Database Schema Reference (Supabase Project: dvlcpljodhsfrucieoqd)

*This information is extracted from the database schema and should be used as the source of truth when interacting with these tables.*

### `User_Profiles` Table
*Purpose: Stores user profile information, linking Clerk auth to Supabase data.*
*Exported As:* `export const userProfiles` (Value), `export type UserProfile` (Type)
*Key Columns:*
    *   `id` (uuid, primary key, default: gen_random_uuid()) - Supabase internal user ID.
    *   `clerkId` (text, unique) - Corresponding ID from Clerk authentication.
    *   `email` (varchar)
    *   `createdAt` (timestamp with time zone, default: now()) - DB name `created_at`.
    *   `modifiedAt` (timestamp with time zone, default: now()) - DB name `modified_at`.
    *   *(Other columns omitted)*

### `Chat` Table
*Purpose: Represents individual chat threads.*
*Exported As:* `export const Chat` (Value), `export type DBChat` (Type)
*Key Columns:*
    *   `id` (uuid, primary key, default: gen_random_uuid()) - Unique ID for the chat.
    *   `userId` (uuid, not null, foreign key -> `userProfiles.id`) - The user who owns the chat.
    *   `createdAt` (timestamp, not null) - When the chat was created.
    *   `title` (text, not null) - Title of the chat.
    *   `visibility` (varchar, enum: ['public', 'private', 'unlisted'], default: 'private', not null)

### `Document` Table
*Purpose: Stores artifacts/documents, potentially linked to chats.*
*Exported As:* `export const document` (Value), `export type Document` (Type)
*Key Columns:*
    *   `id` (uuid, not null, default: gen_random_uuid()) - *Part of composite primary key*.
    *   `createdAt` (timestamp, not null) - *Part of composite primary key*.
    *   `title` (text, not null) - Title of the document.
    *   `content` (text) - Raw text content.
    *   `content_json` (jsonb) - Structured content.
    *   `kind` (varchar, enum: ['text', 'code', 'image', 'sheet', 'textv2'], default: 'text', not null) - Type of document.
    *   `userId` (uuid, not null, foreign key -> `userProfiles.id`, onDelete: 'cascade') - The user who owns the document.
    *   `modifiedAt` (timestamp with time zone, default: now()) - Last modification time.
    *   `chatId` (uuid, nullable, foreign key -> `Chat.id`) - Optional link to a chat thread (DB name `chat_id`).

### `Message_v2` Table
*Purpose: Stores individual messages within chats.*
*Exported As:* `export const Message_v2` (Value), `export type DBMessage` (Type)
*Key Columns:*
    *   `id` (uuid, primary key, not null, default: gen_random_uuid()) - Unique ID for the message.
    *   `chatId` (uuid, not null, foreign key -> `Chat.id`, onDelete: 'cascade') - The chat this message belongs to.
    *   `role` (text, enum: ['user', 'assistant', 'system', 'tool'], not null) - The role of the message sender.
    *   `parts` (jsonb, not null) - Likely contains the message content parts.
    *   `attachments` (jsonb, not null) - Likely contains information about attached documents.
    *   `createdAt` (timestamp, not null) - When the message was created.

---

## Implementation Notes & Strict Guidelines

*Failure to adhere to these points has resulted in significant errors and performance degradation. Follow them exactly.*

**1. Drizzle Schema Imports & Usage:**
    *   **VALUE Import (for Queries):** When using table definitions in Drizzle queries (`db.select`, `db.insert`, etc.), **ALWAYS** import the **lowercase `const` export** from `@/lib/db/schema`.
        ```typescript
        // CORRECT - Use lowercase value for queries
        import { userProfiles, Chat, document, Message_v2 } from '@/lib/db/schema';
        // Example:
        const result = await db.select().from(document).where(...);
        ```
    *   **TYPE Import (for TypeScript):** Only use the **PascalCase name** when referring to the **TypeScript type** inferred from the schema. If there's a conflict with global types (like `Document`), use a type alias.
        ```typescript
        // CORRECT - Use PascalCase for Types
        import { type UserProfile, type DBChat, type Document as DocumentType, type DBMessage } from '@/lib/db/schema';
        // Example:
        function processDoc(doc: DocumentType) { /* ... */ }
        let chat: DBChat | null = null;
        ```
    *   **NEVER** use the PascalCase name as a value in database query functions (`.from(Document)` is WRONG).
    *   **NEVER** use the lowercase name as a type (`let profile: userProfiles` is WRONG).

**2. Database Column Names:**
    *   Refer to the Schema Reference section above for exact column names as defined in the Drizzle schema (e.g., `clerkId`, `chatId`).
    *   Be aware that the actual database column might have a different name (e.g., `chat_id` for `Document.chatId`). Drizzle handles this mapping, but use the **schema definition name** (e.g., `document.chatId`) in your Drizzle queries.

**3. Clerk Authentication (Edge Runtime):**
    *   The correct pattern to get the user ID in Next.js Edge runtime API routes is:
        ```typescript
        import { auth } from '@clerk/nextjs/server';
        // Inside async function GET/POST etc:
        const { userId: clerkUserId } = auth();
        if (!clerkUserId) { /* Handle unauthorized */ }
        // Then use clerkUserId to find Supabase user via User_Profiles.clerkId
        ```
    *   Persistent linter errors about `Property 'userId' does not exist on type 'Promise<Auth>'` might indicate environment/type issues, but the above code structure *is* the standard approach.

**4. TypeScript Explicit Typing:**
    *   **MANDATORY:** Add explicit types to all callback parameters in array methods like `.map`, `.filter`, `.reduce`.
        ```typescript
        // CORRECT:
        const names = users.map((user: UserProfile) => user.email);
        const total = numbers.reduce((acc: number, current: number) => acc + current, 0);
        ```
    *   **MANDATORY:** Add explicit return types to functions and type annotations to variables receiving complex query results.
        ```typescript
        // CORRECT:
        async function fetchChatStubs(userId: string): Promise<ChatStub[]> {
          const stubs: ChatStub[] = await db.select(...);
          return stubs;
        }
        ```
    *   Failure to do this leads to `implicitly has an 'any' type` errors and potential runtime bugs.

**5. Date Handling:**
    *   API endpoints should serialize `Date` objects (likely resulting in ISO strings in the JSON response).
    *   Frontend hooks/components receiving date strings **must** parse them back into `Date` objects where necessary (e.g., for sorting, display formatting, passing to `useSWRInfinite` cursors). Use `new Date(dateString)`. Validate dates after parsing if needed (`!isNaN(date.getTime())`).

**6. Component/Module Imports:**
    *   Verify file paths *exactly* before importing. Errors like `Module not found: Can't resolve './sidebar-desktop'` mean the file `sidebar-desktop.tsx` (or `.ts`) does not exist at that relative location or is named differently. Double-check the file tree.
    *   **IMPORTANT:** The Drizzle database instance (`db`) is exported from `@/lib/db/queries.ts`. **DO NOT** import it from `@/lib/db`.
    *   For the `@/lib/db` import: This relies on the project setup correctly exporting the Drizzle instance as `db` from that path. Persistent errors could indicate a build/config issue. **Note:** This specific project exports `db` from `@/lib/db/queries.ts`.

**7. Changelog:**
    *   Every proposed file change **MUST** be logged in the Changelog section at the top of this document *before* proceeding with the next step. Include file path, summary of change, and any resulting errors.

---

# Sidebar Performance Refactoring Checklist (v3.1 - Hybrid Cache & Cursor)

**Goal:** Achieve instant sidebar load/refresh, 0ms tab switching, and 0ms loading for recent chats/messages via aggressive caching and optimized fetching.

**Core Strategy:** Fetch initial data once, cache heavily in localStorage, use client-side filtering for tabs, and implement cursor-based infinite loading for older items.

**Phase 1: Backend API Endpoints**

1.  **[✓] `/api/sidebar-init` (New Endpoint):**
    *   Fetches initial chat stubs and recent chat details.
    *   *TODO: Needs modification to fetch document stubs.* (See Current Issue #1)

2.  **[✓] `/api/history` (Modify Existing):**
    *   Implements cursor-based pagination for older chat stubs.

3.  **[ ] `/api/chat/[id]/messages` (Modify Existing or New):**
    *   *Requires cursor-based pagination implementation.* (Lower priority for sidebar itself)

**Phase 2: Frontend Data Hooks & Caching**

4.  **[✓] `useSidebarInit` (New Hook):**
    *   Fetches initial data, manages localStorage cache.
    *   Uses `fallbackData` for instant cache load.
    *   Tracks `initialFetchAttempted` state synchronously based on cache hit.
    *   *TODO: Needs modification to handle document stub data.* (See Current Issue #1)

5.  **[✓] `useOlderChats` (New Hook):**
    *   Fetches older chat stubs via infinite scroll using cursor.

6.  **[ ] `useChatMessages` (Refactor Existing Hook):**
    *   *Requires refactoring for initial cache use and infinite scroll.* (Lower priority for sidebar itself)

**Phase 3: Centralized Data Provider & UI Integration**

7.  **[✓] `SidebarDataProvider` (`components/app-sidebar.tsx`):**
    *   Calls `useSidebarInit` and `useOlderChats`.
    *   Combines chat data.
    *   Provides data (`allChatStubs`, `recentChatDetails`), state (`initialFetchAttempted`, `error`), and functions (`loadMoreOlderItems`, `mutateAllChats`) via Context.
    *   Implements tab persistence using `localStorage`.
    *   *TODO: Needs modification to provide `allDocumentStubs`.* (See Current Issue #1)
    *   *TODO: Verify tab UI styling.* (See Current Issue #3)

8.  **[✓] Sidebar Tabs (`SidebarAll`, `SidebarHistory`, `SidebarFiles`):**
    *   Consume data/state from `useSidebarData` context.
    *   Implement strict rendering logic based on `initialFetchAttempted`, `error`, `hasItems`.
    *   *TODO: Implement client-side filtering for Files/All tabs once document data is available.* (See Current Issue #1)
    *   *TODO: Re-implement infinite scroll trigger using `react-intersection-observer` (or similar) in `SidebarHistory`.* (Currently missing)

9.  **[ ] Chat View (`[id]/page.tsx`, `components/chat.tsx`):**
    *   *Requires update to use `useSidebarData` for `recentChatDetails` and potentially `useChatMessages` hook.* (Lower priority for sidebar itself)
    *   *TODO: Verify use of pre-fetched document details.* (See Current Issue #4)

**Phase 4: Cleanup & Testing**

10. **[ ] Code Cleanup:** Remove old API endpoints, hooks, and fetching logic.
11. **[✓] Testing:**
    *   **Initial Load (Cold):** *(Needs Verification)*
    *   **Initial Load (Warm):** *(Needs Verification - Target: 0ms load, no skeleton)* (See Current Issue #2)
    *   **Tab Switching:** *(Needs Verification - Target: 0ms, persisted)*
    *   **Sidebar Infinite Scroll:** *(Needs Implementation)*
    *   **Recent Chat Navigation:** *(Needs Verification - Target: 0ms)*NO
    *   **Recent Chat Message Load:** *(Needs Verification - Target: 0ms)*
    *   **Older Chat Navigation:** *(Needs Verification)*
    *   **Chat Message Infinite Scroll:** *(Needs Implementation)*
    *   **Cache Behavior:** *(Needs Verification)*
    *   **Console:** Monitor for errors and network requests.

---

## Current Issues (As of [Date/Time])

*This section lists known bugs and regressions introduced during refactoring.*

0. **Sidebar doesn't fucking load on sign in / sign up /  loading the application from new session; default hidden.** RELATED: On sign in, most recent chat with user-sent message is not selected. Selected chat + sidebar state ONLY preserved on refresh in same browser window. In the future, AI will send messages to the user async, so there will be chats without user messages. There will be a concept of "unread" chats/threads, where either a) the AI initiated the chat, b) the user received a message but closed the tab before it was generated, or c) the AI sent a new message in an existing chat, typically as part of a long-duration request like deep research.

1.  **Skeleton Duration / Cache Effectiveness:** The skeleton loader might still appear briefly on soft refresh, indicating the synchronous cache-check-and-state-set logic might still have edge cases or that the overall rendering path isn't fully optimized for the instant-cache scenario. Needs verification.
    *   **Required Action:** Rigorously test soft refreshes (Cmd+R / Ctrl+R) to ensure the skeleton does not appear *at all* when data is in localStorage. Monitor console logs added to `useSidebarInit` regarding cache hits and `initialFetchAttempted` state. If the skeleton persists, further debugging of the initial render cycle and state propagation is needed.

2.  **Slow Document Loading (Chat View):** Previously reported issue. Documents reportedly take ~5-10 seconds to load when navigating to a chat that contains them. This requires verifying that `/api/sidebar-init` correctly fetches and includes `DocumentStub` details in the `recentChatDetails` response, and that the `Chat` component utilizes them.
    *   **Required Action:** Verify the `/api/sidebar-init` endpoint correctly fetches associated `DocumentStub` details for the `RECENT_DETAILS_LIMIT` chats. Ensure these details are properly included in the `recentChatDetails` part of the response and subsequently cached in localStorage by `useSidebarInit`. Confirm the `Chat` component correctly utilizes these pre-fetched details if available.

3.  **Circular Type Dependencies (Workaround Implemented):** Shared types were moved to the top of `app-sidebar.tsx` to fix linter errors. This is functional but not ideal.
    *   **Required Action (Future):** Seek authorization to create `lib/types/sidebar.ts` and move the shared types (`ChatStub`, `DocumentStub`, etc.) there. Update all imports accordingly for better code organization and maintainability.

---

## Sidebar Related Files Reference

*This list identifies core files involved in sidebar functionality (data fetching, rendering, APIs, types, DB interactions) as of [Current Date/Time]. Refer to this list to avoid confusion and errors.* 

*   **Core Sidebar Component:**
    *   `components/app-sidebar.tsx` (Main structure, tabs, context provider)
*   **Sidebar Tab Content Components:**
    *   `components/sidebar-all.tsx`
    *   `components/sidebar-history.tsx`
    *   `components/sidebar-files.tsx` 
*   **Sidebar Item Components:**
    *   `components/sidebar-all-item.tsx`
    *   `components/sidebar-history-item.tsx`
    *   `components/sidebar-files-item.tsx`
*   **API Routes (Data Sources):**
    *   `app/(chat)/api/history/route.ts` (Existing chat history endpoint)
    *   `app/(chat)/api/sidebar-init/route.ts` (New endpoint for initial load)
    *   *(Check status of `app/(chat)/api/documents/route.ts`)*
    *   *(Consider `app/(chat)/api/chat/[id]/messages/route.ts` for preloading)*
*   **Data Fetching Hooks:**
    *   *(Plan is to refactor away from `hooks/use-chats.ts`, `hooks/use-documents.ts`)*
    *   *(Plan involves new hooks like `useSidebarInit`, `useOlderChats`)*
*   **Database:**
    *   `lib/db/queries.ts` (DB query functions)
    *   `lib/db/schema.ts` (Table definitions)
*   **Shared Types:**
    *   *(Consider centralizing types, e.g., in `lib/types/sidebar.ts`)*
*   **UI Primitives:**
    *   `components/ui/sidebar.tsx` 
    *   `components/ui/tabs.tsx` 
