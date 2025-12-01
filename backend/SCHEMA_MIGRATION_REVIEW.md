# Schema Migration Review

## Overview

Review of database schema models migrated from TypeScript (Drizzle) to Python (SQLAlchemy).

## Schema Comparison

### ✅ Migrated Models

| TypeScript Model | Python Model | Status | Notes |
|----------------|--------------|--------|-------|
| `User` | `app/models/user.py` | ✅ Complete | All fields migrated |
| `Chat` | `app/models/chat.py` | ✅ Complete | All fields migrated |
| `Message_v2` | `app/models/message.py` | ✅ Complete | All fields migrated |
| `Vote_v2` | `app/models/vote.py` | ✅ Complete | All fields migrated |
| `Document` | `app/models/document.py` | ✅ Complete | All fields migrated, composite PK |
| `Stream` | `app/models/stream.py` | ✅ Complete | All fields migrated |
| `Suggestion` | `app/models/suggestion.py` | ✅ **NEW** | Just created, composite FK to Document |

### ❌ Deprecated Models (Not Migrated)

| TypeScript Model | Status | Reason |
|----------------|--------|--------|
| `Message` (deprecated) | ❌ Not migrated | Deprecated in favor of `Message_v2` |
| `Vote` (deprecated) | ❌ Not migrated | Deprecated in favor of `Vote_v2` |

## Model Details

### User
- ✅ `id` (UUID, PK)
- ✅ `email` (String, unique)
- ✅ `password` (String, nullable)
- ✅ Relationships: `chats`, `documents`, `suggestions`

### Chat
- ✅ `id` (UUID, PK)
- ✅ `createdAt` (DateTime)
- ✅ `title` (Text)
- ✅ `userId` (UUID, FK to User)
- ✅ `visibility` (String, enum: "public", "private")
- ✅ `lastContext` (JSONB, nullable)
- ✅ Relationships: `user`, `messages`, `votes`

### Message_v2
- ✅ `id` (UUID, PK)
- ✅ `chatId` (UUID, FK to Chat)
- ✅ `role` (String)
- ✅ `parts` (JSON)
- ✅ `attachments` (JSON)
- ✅ `createdAt` (DateTime)
- ✅ Relationships: `chat`, `votes`

### Vote_v2
- ✅ `chatId` (UUID, PK, FK to Chat)
- ✅ `messageId` (UUID, PK, FK to Message_v2)
- ✅ `isUpvoted` (Boolean)
- ✅ Relationships: `chat`, `message`

### Document
- ✅ `id` (UUID, part of composite PK)
- ✅ `createdAt` (DateTime, part of composite PK)
- ✅ `title` (Text)
- ✅ `content` (Text, nullable)
- ✅ `kind` (String, enum: "text", "code", "image", "sheet")
- ✅ `userId` (UUID, FK to User)
- ✅ Relationships: `user`
- ⚠️ **Note**: Column name mismatch - database uses `"text"` for `kind` column

### Stream
- ✅ `id` (UUID, PK)
- ✅ `chatId` (UUID, FK to Chat)
- ✅ `createdAt` (DateTime)

### Suggestion (NEW)
- ✅ `id` (UUID, PK)
- ✅ `documentId` (UUID, part of composite FK)
- ✅ `documentCreatedAt` (DateTime, part of composite FK)
- ✅ `originalText` (Text)
- ✅ `suggestedText` (Text)
- ✅ `description` (Text, nullable)
- ✅ `isResolved` (Boolean, default False)
- ✅ `userId` (UUID, FK to User)
- ✅ `createdAt` (DateTime)
- ✅ Relationships: `user`
- ⚠️ **Note**: Composite foreign key to Document (id, createdAt)

## Query Functions

### ✅ Migrated Query Functions

| TypeScript Query | Python Query | Status |
|----------------|--------------|--------|
| `getUser` | Not needed (JWT auth) | N/A |
| `createUser` | Not needed (JWT auth) | N/A |
| `saveChat` | `app/db/queries/chat_queries.py::save_chat` | ✅ |
| `getChatById` | `app/db/queries/chat_queries.py::get_chat_by_id` | ✅ |
| `getChatsByUserId` | `app/db/queries/chat_queries.py::get_chats_by_user_id` | ✅ |
| `deleteChatById` | `app/db/queries/chat_queries.py::delete_chat_by_id` | ✅ |
| `saveMessages` | `app/db/queries/chat_queries.py::save_messages` | ✅ |
| `getMessagesByChatId` | `app/db/queries/chat_queries.py::get_messages_by_chat_id` | ✅ |
| `getVotesByChatId` | `app/db/queries/vote_queries.py::get_votes_by_chat_id` | ✅ |
| `voteMessage` | `app/db/queries/vote_queries.py::vote_message` | ✅ |
| `getDocumentsById` | `app/db/queries/document_queries.py::get_documents_by_id` | ✅ |
| `saveDocument` | `app/db/queries/document_queries.py::save_document` | ✅ |
| `deleteDocumentsByIdAfterTimestamp` | `app/db/queries/document_queries.py::delete_documents_by_id_after_timestamp` | ✅ |
| `saveSuggestions` | `app/db/queries/suggestion_queries.py::save_suggestions` | ✅ **NEW** |
| `getSuggestionsByDocumentId` | `app/db/queries/suggestion_queries.py::get_suggestions_by_document_id` | ✅ **NEW** |

## Key Differences

### 1. Naming Conventions
- **TypeScript**: camelCase (e.g., `createdAt`, `userId`)
- **Python**: snake_case (e.g., `created_at`, `user_id`)
- **Solution**: Use `name` parameter in SQLAlchemy Column to map to database column names

### 2. Composite Keys
- **Document**: Composite primary key `(id, createdAt)` - ✅ Handled
- **Suggestion**: Composite foreign key `(documentId, documentCreatedAt)` - ✅ Handled

### 3. Relationships
- All relationships properly defined with `relationship()` and `back_populates`
- User model now includes `suggestions` relationship

## Files Created/Modified

### New Files
- ✅ `backend/app/models/suggestion.py` - Suggestion model
- ✅ `backend/app/db/queries/suggestion_queries.py` - Suggestion query functions

### Modified Files
- ✅ `backend/app/models/user.py` - Added `suggestions` relationship
- ✅ `backend/app/models/__init__.py` - Added `Suggestion` to exports
- ✅ `backend/app/ai/tools/suggestions.py` - Updated to use `save_suggestions`

## Testing Checklist

- [ ] Test creating suggestions via `requestSuggestions` tool
- [ ] Test saving suggestions to database
- [ ] Test retrieving suggestions by document ID
- [ ] Verify composite foreign key constraint works
- [ ] Test cascade deletion (if Document is deleted)

## Summary

✅ **All required models are now migrated!**

The Suggestion model was the only missing model. It has been:
1. Created with all required fields
2. Properly configured with composite foreign key to Document
3. Integrated with query functions
4. Connected to the User relationship
5. Integrated into the `requestSuggestions` tool

The schema migration is now complete!

