# Snake_Case Conversion Checklist

This document tracks the progress of converting the codebase and database from camelCase/PascalCase to snake_case.

---

## Phase 1: Database Schema (Supabase: dvlcpljodhsfrucieoqd)

*Update Method: SQL Migration (`mcp_supabase_apply_migration`).*
*Migration files created:*
  *- `supabase/migrations/convert_to_snake_case_up.sql`*
  *- `supabase/migrations/convert_to_snake_case_down.sql`*

### Tables
  - [ ] `User_Profiles` -> `user_profiles`
  - [ ] `Message_v2` -> `messages`
  - [ ] `Vote_v2` -> `votes`
  - [ ] `Document` -> `documents`
  - [ ] `Suggestion`  -> `suggestions`
  - [ ] `Chat` -> `chats`

### Columns

  **Table: `Suggestion`**
  - [ ] `userId` -> `user_id`
  - [ ] `documentId` -> `document_id`
  - [ ] `documentCreatedAt` -> `document_created_at`
  - [ ] `originalText` -> `original_text`
  - [ ] `suggestedText` -> `suggested_text`
  - [ ] `isResolved` -> `is_resolved`
  - [ ] `createdAt` -> `created_at`

  **Table: `Document`**
  - [ ] `userId` -> `user_id`
  - [ ] `createdAt` -> `created_at`
  - [ ] `modifiedAt` -> `modified_at`
  - [x] `chat_id` (Already snake_case)
  - [x] `content_json` (Already snake_case)

  **Table: `User_Profiles`**
  - [x] `clerk_id` (Already snake_case)
  - [x] `created_at` (Already snake_case)
  - [x] `modified_at` (Already snake_case)
  - [x] `google_refresh_token` (Already snake_case)
  - [x] `pdl_person_data` (Already snake_case)
  - [x] `pdl_org_data` (Already snake_case)
  - [x] `person_deep_research_data` (Already snake_case)
  - [x] `org_deep_research_data` (Already snake_case)
  - [x] `org_website_scrape` (Already snake_case)
  - [x] `email` (Already snake_case)


  **Table: `Chat`**
  - [ ] `userId` -> `user_id`
  - [ ] `createdAt` -> `created_at`
  - [x] `visibility` (Already snake_case)

  **Table: `Message_v2`**
  - [ ] `chatId` -> `chat_id`
  - [ ] `createdAt` -> `created_at`
  - [x] `role` (Already snake_case)
  - [x] `parts` (Already snake_case)
  - [x] `attachments` (Already snake_case)


  **Table: `Vote_v2`**
  - [ ] `chatId` -> `chat_id`
  - [ ] `messageId` -> `message_id`
  - [ ] `isUpvoted` -> `is_upvoted`

### Other DB Objects
  - [x] Functions (All seem to be snake_case already)
  - [x] Triggers (All seem to be snake_case already)
  - [x] RLS Policies (Use descriptive names, no change needed)

---

## Phase 2: Codebase - Schema Definitions (Drizzle ORM)

*Update Method: Manual Edit in `lib/db/schema.ts`. Requires subsequent linter configuration update (`eslintrc.json` or similar) to allow snake_case type aliases.*

### Drizzle Table Variables
  - [ ] `userProfiles` -> `user_profiles`
  - [ ] `Chat` -> `chats`
  - [ ] `Message_v2` -> `messages`
  - [ ] `vote` -> `votes`
  - [ ] `document` -> `documents`
  - [ ] `suggestion` -> `suggestions`

### Drizzle Column Definitions

  **Table: `User_Profiles` (Variable: `user_profiles`)**
  - [ ] `clerkId` -> `clerk_id`
  - [ ] `createdAt` -> `created_at`
  - [ ] `modifiedAt` -> `modified_at`
  - [ ] `googleRefreshToken` -> `google_refresh_token`

  **Table: `chats` (Variable: `chats`)**
  - [ ] `userId` -> `user_id`
  - [ ] `createdAt` -> `created_at`

  **Table: `messages` (Variable: `messages`)**
  - [ ] `chatId` -> `chat_id`
  - [ ] `createdAt` -> `created_at`

  **Table: `votes` (Variable: `votes`)**
  - [ ] `chatId` -> `chat_id`
  - [ ] `isUpvoted` -> `is_upvoted`

  **Table: `documents` (Variable: `documents`)**
  - [ ] `createdAt` -> `created_at`
  - [ ] `userId` -> `user_id`
  - [ ] `modifiedAt` -> `modified_at`
  - [ ] `chatId` -> `chat_id` (Rename Drizzle definition to match DB `chat_id`)

  **Table: `suggestions` (Variable: `suggestions`)**
  - [ ] `documentId` -> `document_id`
  - [ ] `documentCreatedAt` -> `document_created_at`
  - [ ] `originalText` -> `original_text`
  - [ ] `suggestedText` -> `suggested_text`
  - [ ] `isResolved` -> `is_resolved`
  - [ ] `userId` -> `user_id`
  - [ ] `createdAt` -> `created_at`

### TypeScript Type Aliases
  - [ ] `UserProfile` -> `user_profile`
  - [ ] `DBChat` -> `db_chat`
  - [ ] `DBMessage` -> `db_message`
  - [ ] `Vote` -> `vote`
  - [ ] `Document` -> `document`
  - [ ] `Suggestion` -> `suggestion`

---

## Phase 3: Codebase - API Routes & Server Logic

*Update Method: Use IDE Refactoring ("Rename Symbol" / F2) for functions/variables and fix TypeScript compiler (`tsc`/`pnpm build`) errors after Phase 2 completion. **Do not use basic text find/replace or bash scripts.** Git will be used for reversibility.*

### Variables to Rename
  - [ ] `clerkUserId` -> `clerk_user_id` (Various API routes)
  - [ ] `userId` -> `user_id` (Various API routes - where it means profile ID)
  - [ ] `userProfileId` -> `user_profile_id` (`app/(chat)/api/chat/route.ts`)
  - [ ] `finalChatId` -> `final_chat_id` (`app/(chat)/api/chat/route.ts`)
  - [ ] `lastUserMessageCreatedAt` -> `last_user_message_created_at` (`app/(chat)/api/chat/route.ts`)

### Property Access Updates (Post Drizzle Schema Change)
  - [ ] `userProfiles.clerkId` -> `user_profiles.clerk_id`
  - [ ] `document.userId` -> `documents.user_id`
  - [ ] `chat.userId` -> `chats.user_id`
  - [ ] `suggestion.userId` -> `suggestions.user_id`
  - [ ] `Message_v2.chatId` -> `messages.chat_id`
  - [ ] `vote.isUpvoted` -> `votes.is_upvoted`
  - *... (and others corresponding to renamed Drizzle columns/variables)*

### Function Parameters/Object Keys (Representing DB Fields)
  - [ ] `chatId` -> `chat_id`
  - [ ] `messageId` -> `message_id`
  - [ ] `userId` -> `user_id`
  - [ ] `createdAt` -> `created_at`
  - *... (wherever these are used in function signatures or object literals mapping to DB fields)*

### Functions to Rename (Definition & Call Sites)
  - **`lib/db/queries.ts`**
    - [ ] `saveChat` -> `save_chat`
    - [ ] `deleteChatById` -> `delete_chat_by_id`
    - [ ] `getChatsByUserId` -> `get_chats_by_user_id`
    - [ ] `getChatById` -> `get_chat_by_id`
    - [ ] `saveMessages` -> `save_messages`
    - [ ] `getMessagesByChatId` -> `get_messages_by_chat_id`
    - [ ] `voteMessage` -> `vote_message`
    - [ ] `getVotesByChatId` -> `get_votes_by_chat_id`
    - [ ] `saveDocument` -> `save_document`
    - [ ] `getDocumentsById` -> `get_documents_by_id`
    - [ ] `getDocumentById` -> `get_document_by_id`
    - [ ] `deleteDocumentsByIdAfterTimestamp` -> `delete_documents_by_id_after_timestamp`
    - [ ] `saveSuggestions` -> `save_suggestions`
    - [ ] `getSuggestionsByDocumentId` -> `get_suggestions_by_document_id`
    - [ ] `getMessageById` -> `get_message_by_id`
    - [ ] `deleteMessagesByChatIdAfterTimestamp` -> `delete_messages_by_chat_id_after_timestamp`
    - [ ] `updateChatVisiblityById` -> `update_chat_visibility_by_id`
    - [ ] `getDocumentsByUserId` -> `get_documents_by_user_id`
  - **`lib/ai/tools/tool-list.ts`**
    - [ ] `assembleTools` -> `assemble_tools`
  - **`lib/artifacts/server.ts`**
    - [ ] `createDocumentHandler` -> `create_document_handler`
  - **`lib/utils.ts`**
    - [ ] `getLocalStorage` -> `get_local_storage`
    - [ ] `generateUUID` -> `generate_uuid`
    - [ ] `addToolMessageToChat` -> `add_tool_message_to_chat`
    - [ ] `sanitizeResponseMessages` -> `sanitize_response_messages`
    - [ ] `getMostRecentUserMessage`

## Phase 4: Codebase - Frontend Components & Logic

*Update Method: Use IDE Refactoring ("Rename Symbol" / F2) for functions/hooks/props and fix TypeScript compiler (`tsc`/`pnpm build`) errors after Phase 3 completion. Check component state/variables contextually. Git will be used for reversibility.*

### Variables to Rename
  - [ ] `clerkUserId` -> `clerk_user_id` (Various API routes)
  - [ ] `userId` -> `user_id` (Various API routes - where it means profile ID)
  - [ ] `userProfileId` -> `user_profile_id` (`app/(chat)/api/chat/route.ts`)
  - [ ] `finalChatId` -> `final_chat_id` (`app/(chat)/api/chat/route.ts`)
  - [ ] `lastUserMessageCreatedAt` -> `last_user_message_created_at` (`app/(chat)/api/chat/route.ts`)

### Property Access Updates (Post Drizzle Schema Change)
  - [ ] `userProfiles.clerkId` -> `user_profiles.clerk_id`
  - [ ] `document.userId` -> `documents.user_id`
  - [ ] `chat.userId` -> `chats.user_id`
  - [ ] `suggestion.userId` -> `suggestions.user_id`
  - [ ] `Message_v2.chatId` -> `messages.chat_id`
  - [ ] `vote.isUpvoted` -> `votes.is_upvoted`
  - *... (and others corresponding to renamed Drizzle columns/variables)*

### Function Parameters/Object Keys (Representing DB Fields)
  - [ ] `chatId` -> `chat_id`
  - [ ] `messageId` -> `message_id`
  - [ ] `userId` -> `user_id`
  - [ ] `createdAt` -> `created_at`
  - *... (wherever these are used in function signatures or object literals mapping to DB fields)*

### Functions to Rename (Definition & Call Sites)
  - **`lib/db/queries.ts`**
    - [ ] `saveChat` -> `save_chat`
    - [ ] `deleteChatById` -> `delete_chat_by_id`
    - [ ] `getChatsByUserId` -> `get_chats_by_user_id`
    - [ ] `getChatById` -> `get_chat_by_id`
    - [ ] `saveMessages` -> `save_messages`
    - [ ] `getMessagesByChatId` -> `get_messages_by_chat_id`
    - [ ] `voteMessage` -> `vote_message`
    - [ ] `getVotesByChatId` -> `get_votes_by_chat_id`
    - [ ] `saveDocument` -> `save_document`
    - [ ] `getDocumentsById` -> `get_documents_by_id`
    - [ ] `getDocumentById` -> `get_document_by_id`
    - [ ] `deleteDocumentsByIdAfterTimestamp` -> `delete_documents_by_id_after_timestamp`
    - [ ] `saveSuggestions` -> `save_suggestions`
    - [ ] `getSuggestionsByDocumentId` -> `get_suggestions_by_document_id`
    - [ ] `getMessageById` -> `get_message_by_id`
    - [ ] `deleteMessagesByChatIdAfterTimestamp` -> `delete_messages_by_chat_id_after_timestamp`
    - [ ] `updateChatVisiblityById` -> `update_chat_visibility_by_id`
    - [ ] `getDocumentsByUserId` -> `get_documents_by_user_id`
  - **`lib/ai/tools/tool-list.ts`**
    - [ ] `assembleTools` -> `assemble_tools`
  - **`lib/artifacts/server.ts`**
    - [ ] `createDocumentHandler` -> `create_document_handler`
  - **`lib/utils.ts`**
    - [ ] `getLocalStorage` -> `get_local_storage`
    - [ ] `generateUUID` -> `generate_uuid`
    - [ ] `addToolMessageToChat` -> `add_tool_message_to_chat`
    - [ ] `sanitizeResponseMessages` -> `sanitize_response_messages`
    - [ ] `getMostRecentUserMessage`