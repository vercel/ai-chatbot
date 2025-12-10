# Phased Cleanup Plan

This document outlines a logical, step-by-step plan to remove code that's now handled by the FastAPI backend.

## Overview

**Goal:** Remove duplicate/unused code while maintaining system stability and allowing for easy rollback if needed.

**Principle:** Each phase should be independently testable and reversible.

**⚠️ IMPORTANT:** See `TEST_COVERAGE_SUMMARY.md` for test coverage analysis. Some endpoints lack tests and should be added before removal.

---

## Phase 0: Add Missing Tests (Before Cleanup)

**Risk Level:** 🟢 Low
**Estimated Time:** 2-3 hours
**Rollback:** Easy (git revert)

### Prerequisites

Review `TEST_COVERAGE_SUMMARY.md` to understand current test coverage.

### Important: Why Write Tests for Endpoints We're Removing?

**✅ YES, it makes sense!** Here's why:

1. **Tests verify the API contract, not the implementation**

   - Route tests (e.g., `tests/routes/chat.test.ts`) call `/api/chat`
   - With routing configured, these requests go to FastAPI
   - Tests verify FastAPI correctly implements the expected API contract
   - Tests will continue to work after cleanup (they test the API, not Next.js code)

2. **Tests serve as regression protection**

   - If FastAPI behavior differs from Next.js, tests will catch it
   - Tests document expected behavior for future developers
   - Tests ensure FastAPI matches the original API contract

3. **Two types of tests needed:**
   - **Route tests** (integration): Test the API contract via HTTP (works with FastAPI via routing)
   - **Backend tests** (unit): Test FastAPI implementation directly

### What to Add

1. **Route tests for `/api/history` endpoints** (Integration tests)

   - Create `tests/routes/history.test.ts`
   - Test GET `/api/history` (with pagination)
   - Test DELETE `/api/history`
   - Test authorization checks
   - **Note:** These will work with FastAPI if routing is configured

2. **Route tests for `GET /api/chat/{id}`** (Integration tests)

   - Add to `tests/routes/chat.test.ts`
   - Test GET existing chat
   - Test GET non-existent chat
   - Test authorization (private vs public)
   - **Note:** These will work with FastAPI if routing is configured

3. **Backend tests for FastAPI endpoints** (Unit/Implementation tests)
   - Create `backend/tests/test_chat.py`
   - Test POST `/api/chat` (FastAPI implementation)
   - Test DELETE `/api/chat` (FastAPI implementation)
   - Test GET `/api/chat/{id}` (FastAPI implementation)
   - Create `backend/tests/test_history.py`
   - Test GET `/api/history` (FastAPI implementation)
   - Test DELETE `/api/history` (FastAPI implementation)

### Verification Steps

```bash
# Run route tests (these will hit FastAPI if routing is configured)
pnpm test tests/routes

# Run backend tests (these test FastAPI directly)
cd backend && pytest

# Verify all new tests pass
# Verify existing tests still pass
```

### Success Criteria

- ✅ All new route tests pass (verify API contract)
- ✅ All new backend tests pass (verify FastAPI implementation)
- ✅ Existing tests still pass
- ✅ Test coverage for all endpoints being removed

---

## Phase 1: Remove Dead Code (Safest - No Dependencies)

**Risk Level:** 🟢 Low
**Estimated Time:** 15 minutes
**Rollback:** Easy (git revert)

### What to Remove

1. **`app/api/chat/stream/route.ts`** (entire file, 274 lines)

   - **Why:** Completely unused - FastAPI now uses its own `/api/v1/chat/stream` endpoint
   - **Verification:** No imports found, FastAPI uses `stream_from_fastapi()` not `stream_from_nextjs()`

2. **`backend/app/api/v1/chat.py`** - Remove `stream_from_nextjs()` function (lines 255-285)
   - **Why:** Dead code - commented out and never called
   - **Verification:** Only `stream_from_fastapi()` is used (line 353)

### Verification Steps

```bash
# 1. Search for any remaining references
grep -r "api/chat/stream" --exclude-dir=node_modules --exclude-dir=.git
grep -r "stream_from_nextjs" --exclude-dir=node_modules --exclude-dir=.git

# 2. Test that chat still works
# - Create a new chat
# - Send a message
# - Verify streaming response works
```

### Success Criteria

- ✅ No build errors
- ✅ Chat creation and streaming works
- ✅ No references to removed code found

---

## Phase 2: Remove Unused API Route Handlers (Verify Routing First)

**Risk Level:** 🟡 Medium
**Estimated Time:** 30 minutes
**Rollback:** Easy (git revert)

### Prerequisites

**⚠️ IMPORTANT:** Before removing, verify that these routes are actually routed to FastAPI:

1. Check `proxy.ts` or routing configuration
2. Verify `NEXT_PUBLIC_FASTAPI_ENDPOINTS` or `NEXT_PUBLIC_USE_FASTAPI_BACKEND` is set
3. Test that requests to these endpoints actually hit FastAPI

### What to Remove

1. **`app/(chat)/api/history/route.ts`** (entire file, 47 lines)

   - **Why:** FastAPI handles `/api/history` (GET, DELETE)
   - **Dependencies:** Uses `getChatsByUserId`, `deleteAllChatsByUserId` from `lib/db/queries.ts`
   - **Verification Needed:**
     - Confirm routing to FastAPI works
     - Check if any direct imports exist

2. **`app/(chat)/api/chat/[id]/route.ts`** (entire file, 109 lines)
   - **Why:** FastAPI handles GET `/api/chat/{chat_id}`
   - **Dependencies:** Uses `getChatById`, `getMessagesByChatId` from `lib/db/queries.ts`
   - **Verification Needed:**
     - Confirm routing to FastAPI works
     - Check if any direct imports exist

### Verification Steps

```bash
# 1. Check routing configuration
grep -r "NEXT_PUBLIC_FASTAPI_ENDPOINTS\|NEXT_PUBLIC_USE_FASTAPI_BACKEND" .
cat proxy.ts  # or wherever routing is configured

# 2. Test endpoints
curl http://localhost:3000/api/history
curl http://localhost:3000/api/chat/{some-id}

# 3. Verify they hit FastAPI (check FastAPI logs)
# 4. Search for any imports
grep -r "from.*api/history\|from.*api/chat/\[id\]" --exclude-dir=node_modules
```

### Success Criteria

- ✅ Routing configuration confirms FastAPI handles these endpoints
- ✅ Endpoints still work (routed to FastAPI)
- ✅ No build errors
- ✅ No direct imports of these route handlers found

---

## Phase 3: Remove Unused Server Actions

**Risk Level:** 🟡 Medium
**Estimated Time:** 15 minutes
**Rollback:** Easy (git revert)

### What to Remove

1. **`app/(chat)/actions.ts`** - Remove `generateTitleFromUserMessage()` function (lines 20-32)
   - **Why:** FastAPI handles title generation in `backend/app/api/v1/chat.py` (lines 82-108)
   - **Dependencies:**
     - Used by `app/(chat)/api/chat/route.ts` (line 45, 138) - but that route is also unused
     - Check if used elsewhere

### Verification Steps

```bash
# 1. Search for all usages
grep -r "generateTitleFromUserMessage" --exclude-dir=node_modules --exclude-dir=.git

# 2. If only used in app/(chat)/api/chat/route.ts, can remove both
# 3. Test that new chats still get titles (FastAPI generates them)
```

### Success Criteria

- ✅ No references found (or only in code we're also removing)
- ✅ New chats still get auto-generated titles
- ✅ No build errors

---

## Phase 4: Remove Unused Database Query Functions (Careful - Check All Usages)

**Risk Level:** 🔴 High
**Estimated Time:** 1-2 hours
**Rollback:** Easy (git revert)

### Prerequisites

**⚠️ CRITICAL:** These functions might still be used by:

- Other API routes (vote, document, files)
- Server actions
- Components that directly query DB
- The `/api/chat/stream` proxy endpoint (if it still exists)

### Functions to Evaluate for Removal

**In `lib/db/queries.ts`:**

#### Chat-related (likely safe if Phase 2 successful):

- `saveChat()` - lines ~83-105
- `deleteChatById()` - lines ~107-124
- `getChatById()` - lines ~233-244
- `getChatsByUserId()` - lines ~157-231
- `deleteAllChatsByUserId()` - lines ~126-155

#### Message-related (verify usage):

- `saveMessages()` - lines ~246-252
  - **Check:** Used by `/api/chat/stream`? Other routes?
- `getMessagesByChatId()` - lines ~254-267
  - **Check:** Used by `/api/chat/stream`? Other routes?
- `getMessageCountByUserId()` - verify location
  - **Check:** Used for rate limiting elsewhere?

#### Stream-related:

- `createStreamId()` - verify location
  - **Check:** Used by `/api/chat/stream`?
- `getStreamIdsByChatId()` - verify location
  - **Check:** Used by resume functionality?

#### Vote-related (verify):

- `voteMessage()` - lines ~269-298
  - **Check:** Is vote endpoint migrated to FastAPI?
- `getVotesByChatId()` - verify location
  - **Check:** Is vote endpoint migrated to FastAPI?

### Verification Steps

```bash
# For each function, search for all usages
grep -r "saveChat\|deleteChatById\|getChatById" --exclude-dir=node_modules --exclude-dir=.git
grep -r "getChatsByUserId\|deleteAllChatsByUserId" --exclude-dir=node_modules --exclude-dir=.git
grep -r "saveMessages\|getMessagesByChatId" --exclude-dir=node_modules --exclude-dir=.git
grep -r "voteMessage\|getVotesByChatId" --exclude-dir=node_modules --exclude-dir=.git
grep -r "createStreamId\|getStreamIdsByChatId" --exclude-dir=node_modules --exclude-dir=.git

# Check which files still use them
# If only used in routes we're removing, safe to remove
# If used elsewhere, keep them
```

### Success Criteria

- ✅ All usages identified and verified
- ✅ Functions only used in removed routes
- ✅ No build errors
- ✅ All functionality still works (via FastAPI)

---

## Phase 5: Remove Unused Route Handler (app/(chat)/api/chat/route.ts)

**Risk Level:** 🟡 Medium
**Estimated Time:** 20 minutes
**Rollback:** Easy (git revert)

### Prerequisites

- Phase 3 complete (generateTitleFromUserMessage removed)
- Phase 4 complete (database queries verified)

### What to Remove

**`app/(chat)/api/chat/route.ts`** - Remove POST and DELETE handlers, but **KEEP**:

- `getStreamContext()` function (lines 68-85) - used by resume functionality
- Exports needed by other files

### Verification Steps

```bash
# 1. Check what's exported and used
grep -r "getStreamContext\|from.*api/chat/route" --exclude-dir=node_modules

# 2. Verify resume functionality still works
# 3. Test that chat POST/DELETE work via FastAPI
```

### Success Criteria

- ✅ Resume functionality still works
- ✅ Chat creation/deletion work via FastAPI
- ✅ No build errors

---

## Phase 6: Clean Up Unused Imports and Dependencies

**Risk Level:** 🟢 Low
**Estimated Time:** 30 minutes
**Rollback:** Easy (git revert)

### What to Clean Up

1. Remove unused imports from files that still exist
2. Remove unused dependencies from `package.json` (if any)
3. Remove unused type definitions
4. Clean up commented-out code

### Verification Steps

```bash
# 1. Run linter to find unused imports
npm run lint  # or your lint command

# 2. Check for unused dependencies
npm run build  # should catch missing deps
```

### Success Criteria

- ✅ No unused imports
- ✅ Build succeeds
- ✅ No linter warnings about unused code

---

## Phase 7: Documentation and Final Verification

**Risk Level:** 🟢 Low
**Estimated Time:** 30 minutes

### Tasks

1. Update documentation to reflect removed code
2. Update `FRONTEND_ENDPOINTS.md` if it references removed routes
3. Update migration docs if needed
4. Add comments explaining why certain code paths exist (if any remain)

### Final Verification

```bash
# 1. Full test suite
npm test

# 2. Manual testing checklist:
# - [ ] Create new chat
# - [ ] Send message (verify streaming)
# - [ ] View chat history
# - [ ] Delete chat
# - [ ] Delete all chats
# - [ ] Vote on message
# - [ ] Resume stream (if applicable)
# - [ ] Upload file
# - [ ] Create/update document

# 3. Check for any remaining dead code
npm run lint
```

---

## Summary Table

| Phase | Files/Functions                                                        | Risk      | Time   | Dependencies                 |
| ----- | ---------------------------------------------------------------------- | --------- | ------ | ---------------------------- |
| 0     | Add missing tests                                                      | 🟢 Low    | 2-3hrs | None (prerequisite)          |
| 1     | `app/api/chat/stream/route.ts`, `stream_from_nextjs()`                 | 🟢 Low    | 15min  | Phase 0 done                 |
| 2     | `app/(chat)/api/history/route.ts`, `app/(chat)/api/chat/[id]/route.ts` | 🟡 Medium | 30min  | Phase 0 done, verify routing |
| 3     | `generateTitleFromUserMessage()`                                       | 🟡 Medium | 15min  | Check usages                 |
| 4     | Database query functions                                               | 🔴 High   | 1-2hrs | Verify all usages            |
| 5     | `app/(chat)/api/chat/route.ts` (POST/DELETE)                           | 🟡 Medium | 20min  | Phases 3-4 done              |
| 6     | Unused imports/deps                                                    | 🟢 Low    | 30min  | All phases done              |
| 7     | Documentation                                                          | 🟢 Low    | 30min  | All phases done              |

**Total Estimated Time:** 5-7 hours (including Phase 0)

---

## Rollback Strategy

Each phase should be committed separately:

```bash
# After each phase
git add .
git commit -m "Phase X: Remove [description]"

# If something breaks
git revert HEAD
```

---

## Notes

- **Don't skip verification steps** - they prevent breaking changes
- **Test after each phase** - catch issues early
- **Keep commits small** - easier to rollback if needed
- **Document any exceptions** - if something must stay, document why

---

## Questions to Answer Before Starting

1. ✅ Is `NEXT_PUBLIC_USE_FASTAPI_BACKEND=true` or endpoints configured?
2. ✅ Are all endpoints actually routed to FastAPI?
3. ✅ Is the resume functionality (`/api/chat/[id]/stream`) still needed?
4. ✅ Are there any edge cases or special code paths to preserve?
