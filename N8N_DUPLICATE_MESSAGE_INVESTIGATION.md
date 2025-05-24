# N8N Duplicate Message Investigation

## 1. Observed Bug

The N8N-based assistant exhibits incorrect behavior, particularly from the second user message onwards in a conversation thread:

*   **Symptom 1: Responding to Previous Message**: The N8N assistant processes and responds to the user's *previous* message instead of the *current* (latest) one.
*   **Symptom 2: Duplicate N8N Webhook Pings & Incorrect Response**:
    *   When the **first user message** is sent in a new thread, the N8N webhook receives one ping with this message, and N8N responds correctly.
    *   When the **second user message** is sent in the same thread, the N8N webhook receives **two distinct pings**:
        1.  A ping containing the *first user message* (a duplicate).
        2.  A ping containing the *second (current) user message*.
    *   N8N then processes and responds *only to the first ping (the duplicate first message)*. The actual second message is effectively ignored by N8N, or its response is superseded.
    *   This pattern is consistently observed across N8N logs, Vercel server logs (showing multiple calls to `/api/chat` or multiple N8N trigger events), and browser behavior.

## 2. Key Findings from Server-Side Analysis

Investigation of Vercel server logs for a problematic `POST /api/chat` request (where the N8N assistant responded to the wrong message) revealed the following:

*   **Finding 2.1: Stale `messages` Array Received by Server**:
    *   The `messages` array received by the `/api/chat` endpoint from the client did **not** contain the user's latest typed message.
    *   Instead, the last message with `role: 'user'` in this received array was the user's *previous* message in the conversation.
    *   *Example Log (`POST /api/chat` during the problematic second submission):*
        ```json
        [API /api/chat] Received messages (images truncated): [
          {
            "id": "cc6ef3ac-3def-44dd-b6e1-90cd5e1a90ef", // OLD USER MESSAGE 1
            "createdAt": "2025-05-24T02:59:32.927Z",
            "role": "user",
            "content": "we removed some logging. just making sure it still works.",
            // ... parts ...
          },
          {
            "id": "76d2f21e-e5f8-4105-aa6b-a1036ac6175e", // Assistant reply to OLD USER MESSAGE 1
            "role": "assistant",
            "content": "Sounds good. Let me know if anything changes.",
            // ... parts ...
            "createdAt": "2025-05-24T02:59:41.126Z"
          }
          // *** The NEW user message was MISSING here ***
        ]
        ```

*   **Finding 2.2: Server-Side Message Extraction (`getMostRecentUserMessage`) is Correct**:
    *   The `lib/utils.ts#getMostRecentUserMessage` function correctly processes the `messages` array it receives.
    *   Given the stale array (as shown above), it correctly identified the old user message (`cc6ef3ac...`) as the "most recent" user message in that array.

*   **Finding 2.3: N8N Payload Construction is Correct (Based on Stale Data)**:
    *   The `/api/chat` route then correctly used this stale `userMessage` data to construct the payload for the N8N webhook.
    *   The `userMessage`, `messageId`, etc., fields in the N8N payload therefore contained information from the old user message.

## 3. Conclusion: Root Cause is Client-Side

The root cause of the N8N assistant processing an old message is that the **client (`components/chat.tsx`, likely an interaction with the `@ai-sdk/react` `useChat` hook) sent an outdated `messages` array to the `/api/chat` backend.** The backend then correctly processed the stale data it was given.

The issue is not with the N8N workflow's interpretation of the payload (as it correctly uses the `userMessage` field), nor is it with the server-side logic for extracting the user message *from the data it received*. The problem is the data itself was stale.

## 4. Comparison with Official Vercel AI Chatbot Template

A key difference was identified when comparing our `components/chat.tsx` with the official Vercel AI Chatbot template:

*   **Official Template**: Uses the `experimental_prepareRequestBody` option in its `useChat` hook. This option customizes the request body sent to the backend, specifically sending only the *very last message* from the client's `messages` array as the primary `message` field (e.g., `message: body.messages.at(-1)`).
*   **Our Application**: Does not use `experimental_prepareRequestBody`. The `useChat` hook therefore sends a more complete `messages` array to the backend (which we observed in logs).

The official template's approach is more resilient to potential timing issues within the client's `useChat` hook regarding the synchronization of its internal `messages` array before sending a request. By explicitly sending only what the client considers its absolute last message, it ensures the backend gets the intended current query.

## 5. Current Application State & Risks

*   **Current State**:
    *   The "endless thinking" / SWR polling issue (related to `GET /api/messages`) is believed to be resolved by correcting the polling path in `components/chat.tsx` to target the verified endpoint `/api/messages` (handled by `app/(chat)/api/messages/route.ts`).
    *   The primary N8N bug – processing a stale user message due to an incorrect payload sent to `POST /api/chat` (handled by `app/(chat)/api/chat/route.ts`) – remains under investigation.
    *   The `isN8nProcessing` state in `components/chat.tsx` manages the "Thinking..." animation and SWR polling initiation for N8N responses.
*   **Risk of `experimental_prepareRequestBody` as a Full Solution**: Previous attempts to implement `experimental_prepareRequestBody` (or similar significant refactors of the chat submission logic in `components/chat.tsx`) as a *full fix* have led to instability. Its current use is for diagnostics.

## 6. Next Steps for Investigation (Focus: Stale Payload to `/api/chat`)

The immediate next step is to understand *why* the `useChat` hook in our client (`components/chat.tsx`), during the problematic second submission, is sending a `messages` array to the backend (`app/(chat)/api/chat/route.ts`) that does not include the user's most recent input. This points to an issue in how the `input` state is captured or how the `messages` array is updated by `useChat` *before* the API call is made.

This will be analyzed using the client-side logging introduced, especially the logs from the `experimental_prepareRequestBody` diagnostic in `components/chat.tsx`.

## 7. Alternative Solution: Aligning with Official Template (`experimental_prepareRequestBody`)

If targeted client-side logging does not reveal a simple fix for why the `useChat` hook sends a stale `messages` array, or if a more robust long-term solution is preferred, we can consider aligning our client-side data submission with the official Vercel AI Chatbot template.

This involves using the `experimental_prepareRequestBody` option within the `useChat` hook in `components/chat.tsx`.

### 7.1. How it Works

The Vercel AI Chatbot template uses `experimental_prepareRequestBody` like so:

```typescript
// In useChat options:
experimental_prepareRequestBody: (body) => ({
  id: chatId, // The chat ID
  message: body.messages.at(-1), // Sends ONLY the last message from the client's perspective
  selectedChatModel: initialChatModel, // Other necessary info
  // ... any other fields the backend expects at the top level
}),
```

This ensures that the client tells the backend exactly what the "current" message is, rather than the backend trying to infer it from a potentially larger (and momentarily stale) array of messages sent by the client.

### 7.2. Required Changes (High-Level if Adopting as a Full Solution)

Implementing this as a full solution (beyond current diagnostics) would require changes in two main places:

1.  **`components/chat.tsx` (Client-side)**:
    *   Modify the `useChat` hook initialization to include the `experimental_prepareRequestBody` option with production-ready logic.
    *   The function provided to this option will need to construct a request body that our `/api/chat` backend (handled by `app/(chat)/api/chat/route.ts`) is prepared to handle. This typically includes the chat `id`, the `message` object (the latest one), and any other necessary parameters like `selectedChatModel`.

2.  **`app/(chat)/api/chat/route.ts` (Server-side)**:
    *   The backend route will need to be updated to expect this new request body structure.

### 7.3. Benefits

*   **Bug Resolution**: This approach directly addresses the root cause of the stale message bug by making the "current message" explicit in the client-server communication.
*   **Alignment with Official Template**: Adopts a pattern used by the Vercel team, which is presumably more robust and has undergone more testing.
*   **Potentially Simpler Backend Logic**: The backend no longer needs to infer the latest user message from an array.

### 7.4. Risks & Considerations

*   **Previous Instability**: As noted, past attempts to implement this or similar significant refactors have caused issues. This requires a very careful, step-by-step implementation and thorough testing.
*   **Backend Changes**: Modifying the `/api/chat` route needs to be done carefully to ensure all functionalities (N8N model interaction, standard model interaction, message saving, title generation, etc.) continue to work correctly with the new request body structure.
*   **N8N History Requirement**: Clarity on whether N8N *truly* needs the `history` array in its payload is essential. If it does, implementing the server-side history fetch adds a step. If not, the N8N payload can be simplified.

## 8. Further Investigation & Fixes (Post-Initial Logging)

Following the initial client-side logging, further analysis of browser and Vercel server logs revealed several key points and led to a series of fixes and diagnostic enhancements:

### 8.1. Log Analysis from Test with Initial Logging:

*   **Browser Console Logs:**
    *   Confirmed a `404 Not Found` error for `GET /api/messages-test?chatId=...`. This indicated a mismatch in the SWR polling endpoint. (This is now corrected to point to `/api/messages`).
    *   Client-side logs from `components/multimodal-input.tsx` and `components/chat.tsx` (before `experimental_prepareRequestBody` was added for logging) showed that the `messages` array held by `useChat` *appeared* correct at the moment of submission.

*   **Vercel Server Logs (`/api/chat`):**
    *   **Key Finding 1 (Unexpected Message):** The second `/api/chat` call (for the user's second message, e.g., "find flight") received a `messages` array that included an *unexpected fourth message*: `[UserMsg1, AssistantReply1, UserMsg2, UnexpectedAssistantReply2]`. The `UnexpectedAssistantReply2` seemed to be another N8N response to the *first* user message. This suggested the client's `messages` state might be acquiring an extra N8N response before the second user message is fully processed and sent.
    *   **Key Finding 2 (Phantom Call):** A *third* `/api/chat` call was observed. This call sent a stale `messages` array containing only `[UserMsg1, AssistantReply1]` to the server. This call was responsible for triggering N8N with the *first user message again*, leading to the duplicate/out-of-context N8N response.
    *   The client logs did not show a corresponding second `handleSubmit` for this phantom server call.

### 8.2. Implemented Fixes and Enhancements:

1.  **Corrected SWR Polling Path:**
    *   **Issue:** The SWR hook in `components/chat.tsx` was polling `/api/messages-test?...`.
    *   **Fix:** Updated the SWR polling path in `components/chat.tsx` to `/api/messages?chatId=${id}`. This endpoint is handled by `app/(chat)/api/messages/route.ts`. This should resolve the 404s previously observed for this polling and allow real-time display of N8N messages.

2.  **Improved `MultimodalInput` Memoization:**
    *   **Issue:** The `React.memo` custom comparison function for `components/multimodal-input.tsx` was not re-rendering the component if only the `messages` or `handleSubmit` props changed.
    *   **Fix:** Updated the `memo` comparison function in `components/multimodal-input.tsx` to include checks for `messages` and `handleSubmit` props.

3.  **Added `experimental_prepareRequestBody` for Precise Logging (Current State):**
    *   **Goal:** To get definitive insight into the exact `messages` array and request body being sent by `useChat().handleSubmit` (from `@ai-sdk/react`) to the `/api/chat` backend (handled by `app/(chat)/api/chat/route.ts`).
    *   **Implementation:** Modified `handleSubmitIntercept` in `components/chat.tsx` to use the `experimental_prepareRequestBody` option *for diagnostic logging*. This function now logs the `defaultSdkBody` (what `useChat` prepares) and the `finalBodyForServer` (the structure our backend expects, based on `defaultSdkBody.messages`). This allows us to see if the `messages` array is already problematic when `useChat` constructs it.

### 8.3. Current Hypotheses (Post-Fixes):

*   The SWR polling path fix should ensure N8N messages appear correctly and in real-time.
*   The `MultimodalInput` memoization fix should prevent stale closures within that component from causing issues.
*   The primary remaining mystery is the **phantom third `/api/chat` call** that sends a stale message history to the server. The new logging with `experimental_prepareRequestBody` will be crucial to see if this call originates from `useChat().handleSubmit` and what its state is.
*   The **unexpected fourth message** (`UnexpectedAssistantReply2`) appearing in the second server call's `messages` array is also a key point. The new logging should clarify if `useChat` includes this message in its `defaultSdkBody.messages`. If so, it suggests a race condition where an N8N response (possibly to the first or even a phantom earlier call) is appended to the client's state *just before* the second user message is submitted.

### 8.4. Next Steps:

*   User to test the application with all recent fixes and the new `experimental_prepareRequestBody` logging.
*   Analyze new browser console logs (especially the `experimental_prepareRequestBody` outputs) and corresponding Vercel server logs for `/api/chat`.
*   Determine if the "phantom call" still occurs and what `messages` array it sends.
*   Determine if the "unexpected assistant message" is present in the `defaultSdkBody.messages` logged by `experimental_prepareRequestBody`.

## 9. Code Revert and Strategy Reset (As of Commit `1b1f7e8`)

Subsequent to the investigations and fixes detailed in Section 8, a decision was made to revert the codebase to a prior state to ensure stability and allow for a more structured approach to resolving the N8N duplicate message bug.

*   **9.1. Code Reverted**: All uncommitted changes were discarded, and the workspace was reset to **commit `1b1f7e8` ("Add execution marker to Chat component for deployment verification")**.
    *   This means that many of the specific code modifications, logging additions (like detailed `experimental_prepareRequestBody` logs), and memoization fixes detailed in Section 8.2 are **no longer present** in the active codebase.
    *   The SWR polling path correction (from `/api/messages-test` to `/api/messages`) *should* persist if it was committed prior to `1b1f7e8`. (This needs verification against git history if doubt arises).

*   **9.2. Current Understanding of the Bug**:
    *   The core issue manifests as the N8N assistant responding to the wrong user message. This is strongly correlated with the N8N webhook receiving duplicate pings: for the second user message in a thread, N8N gets a webhook for the first user message (again) and another for the second user message, then incorrectly responds to the first.
    *   This is believed to stem from the client sending a stale/incorrect payload to `/api/chat` or making duplicate/phantom calls.
    *   The "phantom `/api/chat` call" and the "unexpected assistant message appearing in subsequent payloads" (Findings 8.1) remain strong hypotheses for *how* these incorrect N8N pings and stale payloads occur.

*   **9.3. Revised Strategy**:
    *   The primary strategy is now to **align `components/chat.tsx` (client-side message submission) and `app/(chat)/api/chat/route.ts` (server-side message handling) with the Vercel AI Chatbot template's approach.**
    *   This involves:
        1.  **Client (`components/chat.tsx`)**: Implementing `useChat` with `experimental_prepareRequestBody` to send only the *latest user message* object and necessary identifiers (chat ID, model ID) to the backend. This aims to prevent issues with stale `messages` arrays.
        2.  **Server (`app/(chat)/api/chat/route.ts`)**: Modifying the API route to expect this new, leaner request body (i.e., a single `message` object instead of a full `messages` array). The server will then be responsible for fetching message history from the database and combining it with the new user message before processing or sending to N8N.
    *   This approach is considered more robust and directly addresses the previously identified root cause of stale data.
    *   Careful, step-by-step implementation and thorough testing of both client and server changes will be critical.
    *   The ability for the user to change the AI model on a per-message basis must be incorporated into this new strategy. The `experimental_prepareRequestBody` will need to correctly include the model ID selected for the *current specific submission*. Client-side logic (like `isN8nProcessing`) must also use this per-submission model ID.