# How to Implement WorkOS Role-Based Transcript Protection

## Overview
Switch from Slack channel-based contractor checking to WorkOS role-based permissions. All new users sign up as `member` role and get manually elevated to higher roles for transcript access.

## Permission Model
- **`member`** role = No transcript access (default for all signups)
- **`admin`** or other elevated roles = Full transcript access
- Manual elevation required for full-time employees

## Files That Need Protection

### 1. AI Tools (Core Protection)
**File:** `lib/ai/tools/get-transcript-details.ts`
- **Current:** Checks `isContractor()` function
- **Change to:** Check `session.role === 'member'` → deny access
- **Protection:** Tool-level blocking and chat-level tool exclusion

### 2. API Routes (Direct Access Protection)
**File:** `app/api/transcripts/[id]/route.ts`
- **Current:** Checks `isContractor()` function  
- **Change to:** Check `session.role === 'member'` → return 403
- **Protection:** Blocks full transcript content API calls

**File:** `app/api/transcripts/route.ts`
- **Current:** No contractor protection (allows summaries)
- **Change to:** Check `session.role === 'member'` → return 403
- **Protection:** Blocks transcript listing entirely OR allow summaries only

### 3. UI Components (Client-Side Protection)
**File:** `app/(chat)/transcripts/page.tsx`
- **Current:** No protection (allows summaries)
- **Change to:** Check `session.role === 'member'` → redirect to home OR show limited view
- **Protection:** Page-level access control

**File:** `app/(chat)/transcripts/components/list/transcript-chat-input.tsx`
- **Current:** Checks `isContractor` prop for context building
- **Change to:** Check `session.role === 'member'` for context building
- **Protection:** Chat context limited to summaries vs full transcripts

### 4. Chat Route (Tool Availability)
**File:** `app/(chat)/api/chat/route.ts`
- **Current:** Checks `isContractor()` to conditionally add `getTranscriptDetails` tool
- **Change to:** Check `session.role === 'member'` to exclude tool
- **Protection:** Tool not available to members in AI chat

## Implementation Strategy

### Phase 1: Update Permission Logic
Replace all `isContractor()` calls with `session.role === 'member'` checks:

```typescript
// OLD
const contractorStatus = await isContractor(session.user.email);
if (contractorStatus) {
  // deny access
}

// NEW  
if (session.role === 'member') {
  // deny access
}
```

### Phase 2: Remove Contractor Infrastructure
Files to remove/clean up:
- `lib/auth/contractor-check.ts` - No longer needed
- `lib/redis/client.ts` - May still be needed for other features
- All `isContractor` imports and function calls

### Phase 3: Update Component Props
- Remove `isContractor` prop passing through component tree
- Use `session.role` directly in server components
- Pass `session.role` to client components as needed

## Decision Points

### 1. Transcript Listing Access
**Option A:** Complete blocking - members can't see transcript page at all
**Option B:** Summary-only access - members see list but can't view full content

**Recommendation:** Option B (summary-only) for better UX

### 2. UI Feedback
**Option A:** Redirect to home with no explanation
**Option B:** Show restricted message/limited view
**Option C:** Show transcript summaries with "upgrade needed" for full access

**Recommendation:** Option C for transparency

### 3. Role Elevation Workflow
**Manual Process:**
1. User signs up → gets `member` role automatically
2. Admin manually promotes user in WorkOS dashboard
3. User gets elevated permissions on next sign-in

**Future Enhancement:** Could build admin interface for role management

## Benefits of WorkOS Role Approach

1. **Simpler Logic:** Just check `session.role` instead of complex Slack API calls
2. **Better Performance:** No Redis caching or API calls needed
3. **Centralized Management:** All role management in WorkOS dashboard
4. **Cleaner Code:** Remove contractor checking infrastructure
5. **More Scalable:** Easy to add more roles/permissions later

## Migration Steps

1. **Test current WorkOS session structure** - verify `session.role` is available
2. **Update all permission checks** to use `session.role === 'member'`
3. **Remove contractor checking code** and clean up imports
4. **Test with member and admin roles** to ensure proper blocking/access
5. **Update component prop passing** to use role instead of contractor status
6. **Document role elevation process** for admins

## Files Summary
- **7 files** need role-based protection updates
- **3 files** can be removed (contractor checking infrastructure)  
- **1 new process** for manual role elevation via WorkOS dashboard