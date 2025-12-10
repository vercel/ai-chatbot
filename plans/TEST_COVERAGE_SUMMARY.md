# Test Coverage Summary

This document summarizes existing tests and their coverage of endpoints that will be removed during cleanup.

## Test Infrastructure

- **Frontend Tests:** Playwright (E2E and route tests)
- **Backend Tests:** pytest (FastAPI TestClient)
- **Test Command:** `pnpm test` (runs Playwright tests)
- **Test Configuration:** `playwright.config.ts`

---

## Frontend Test Coverage

### Route Tests (`tests/routes/`)

#### ✅ `/api/chat` - **COMPREHENSIVE COVERAGE**

**File:** `tests/routes/chat.test.ts` (367 lines)

**Tests Cover:**
1. ✅ Empty request body validation (400 error)
2. ✅ Chat creation (POST `/api/chat`)
3. ✅ Authorization checks (users can't access others' chats)
4. ✅ Chat deletion (DELETE `/api/chat?id={id}`)
5. ✅ Stream resumption (`GET /api/chat/{id}/stream`)
   - Resume non-existent chat (404)
   - Resume during generation
   - Resume after generation ended
   - Resume after timeout
   - Authorization checks (private vs public)

**⚠️ IMPORTANT:** These tests directly call `/api/chat` endpoints. After cleanup:
- Tests will still work if routing to FastAPI is configured
- Tests verify the **API contract**, not the implementation
- Need to ensure FastAPI endpoints match the expected behavior

#### ✅ `/api/document` - **COMPREHENSIVE COVERAGE**

**File:** `tests/routes/document.test.ts` (212 lines)

**Tests Cover:**
1. ✅ GET without ID (400 error)
2. ✅ GET non-existent document (404)
3. ✅ POST create document
4. ✅ GET retrieve document
5. ✅ POST update document (new version)
6. ✅ GET retrieve all versions
7. ✅ DELETE document version
8. ✅ Authorization checks (users can't modify others' documents)

**Status:** These tests will continue to work if document endpoint is migrated to FastAPI.

### E2E Tests (`tests/e2e/`)

#### ✅ Chat E2E Tests

**File:** `tests/e2e/chat.test.ts` (173 lines)

**Tests Cover:**
1. ✅ Send message and receive response
2. ✅ URL redirect after message
3. ✅ Send message from suggestion
4. ✅ Toggle send/stop button
5. ✅ Stop generation
6. ✅ Edit and resubmit message
7. ✅ Hide suggested actions
8. ✅ File upload with message
9. ✅ Weather tool call
10. ✅ Vote functionality (upvote, downvote, update)
11. ✅ Create message from URL query

**Status:** These are UI-level tests that will work regardless of backend implementation.

#### ✅ Other E2E Tests

- `tests/e2e/artifacts.test.ts` - Artifact creation/editing
- `tests/e2e/reasoning.test.ts` - Reasoning model tests
- `tests/e2e/session.test.ts` - Session management

---

## Backend Test Coverage

### FastAPI Tests (`backend/tests/`)

**File:** `backend/tests/test_health.py` (20 lines)

**Tests Cover:**
1. ✅ Health check endpoint (`/health`)
2. ✅ Root endpoint (`/`)

**⚠️ LIMITED COVERAGE:** Backend has minimal test coverage. Only health check is tested.

---

## Test Coverage Analysis for Cleanup

### Endpoints Being Removed

| Endpoint | Test Coverage | Status After Cleanup |
|----------|--------------|---------------------|
| `POST /api/chat` | ✅ Comprehensive (chat.test.ts) | ✅ Tests will work if routed to FastAPI |
| `DELETE /api/chat?id={id}` | ✅ Tested (chat.test.ts) | ✅ Tests will work if routed to FastAPI |
| `GET /api/chat/{id}/stream` | ✅ Comprehensive (chat.test.ts) | ⚠️ Need to verify FastAPI supports resume |
| `GET /api/history` | ❌ **NO TESTS FOUND** | ⚠️ Add tests before removing |
| `DELETE /api/history` | ❌ **NO TESTS FOUND** | ⚠️ Add tests before removing |
| `GET /api/chat/{id}` | ❌ **NO TESTS FOUND** | ⚠️ Add tests before removing |
| `POST /api/document` | ✅ Comprehensive (document.test.ts) | ✅ Tests will work if routed to FastAPI |
| `GET /api/document` | ✅ Comprehensive (document.test.ts) | ✅ Tests will work if routed to FastAPI |
| `DELETE /api/document` | ✅ Comprehensive (document.test.ts) | ✅ Tests will work if routed to FastAPI |

### Functions Being Removed

| Function | Test Coverage | Notes |
|----------|--------------|-------|
| `generateTitleFromUserMessage()` | ✅ Indirect (via chat tests) | Tested through chat creation |
| Database query functions | ✅ Indirect (via route tests) | Tested through endpoint behavior |

---

## Recommendations

### Before Cleanup

1. **✅ Good Coverage:**
   - `/api/chat` endpoints have comprehensive tests
   - `/api/document` endpoints have comprehensive tests
   - E2E tests cover user workflows

2. **⚠️ Missing Coverage:**
   - `/api/history` endpoints - **NO TESTS**
   - `GET /api/chat/{id}` - **NO TESTS**
   - Backend FastAPI endpoints - **MINIMAL TESTS**

### Action Items

#### Phase 0: Add Missing Tests (Before Cleanup)

**Priority: HIGH**

1. **Add tests for `/api/history` endpoints:**
   ```typescript
   // tests/routes/history.test.ts
   - GET /api/history (with pagination)
   - DELETE /api/history
   - Authorization checks
   ```

2. **Add tests for `GET /api/chat/{id}`:**
   ```typescript
   // Add to tests/routes/chat.test.ts
   - GET /api/chat/{id} (existing chat)
   - GET /api/chat/{id} (non-existent)
   - Authorization checks (private vs public)
   ```

3. **Add backend tests for FastAPI endpoints:**
   ```python
   # backend/tests/test_chat.py
   - POST /api/chat
   - DELETE /api/chat
   - GET /api/chat/{id}
   - GET /api/history
   - DELETE /api/history
   ```

#### During Cleanup

1. **Run tests after each phase:**
   ```bash
   pnpm test  # Frontend tests
   cd backend && pytest  # Backend tests
   ```

2. **Verify routing works:**
   - Ensure `NEXT_PUBLIC_USE_FASTAPI_BACKEND=true` or endpoints configured
   - Tests should pass whether hitting Next.js or FastAPI (if routing works)

3. **Update test expectations if needed:**
   - FastAPI might return slightly different response formats
   - Update tests to match FastAPI responses if necessary

---

## Test Execution

### Run All Tests
```bash
pnpm test
```

### Run Specific Test Suites
```bash
# Route tests only
pnpm exec playwright test tests/routes

# E2E tests only
pnpm exec playwright test tests/e2e

# Specific test file
pnpm exec playwright test tests/routes/chat.test.ts
```

### Run Backend Tests
```bash
cd backend
pytest
# or
uv run pytest
```

---

## Test Status Summary

| Category | Coverage | Status |
|----------|----------|--------|
| Chat endpoints | ✅ Excellent | Ready for cleanup |
| Document endpoints | ✅ Excellent | Ready for cleanup |
| History endpoints | ❌ Missing | **Add tests first** |
| Chat GET by ID | ❌ Missing | **Add tests first** |
| Backend endpoints | ⚠️ Minimal | **Add tests first** |
| E2E workflows | ✅ Good | Ready for cleanup |

---

## Conclusion

**✅ Safe to proceed with cleanup for:**
- Chat POST/DELETE endpoints (well tested)
- Document endpoints (well tested)
- Server actions (tested indirectly)

**⚠️ Add tests before removing:**
- History endpoints
- GET /api/chat/{id}
- Backend FastAPI endpoints (for regression testing)

**Recommendation:** Add missing tests (Phase 0) before starting cleanup to ensure we can catch regressions.
