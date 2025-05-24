# N8N Duplicate Message Investigation

## 1. Observed Bug

The N8N-based assistant occasionally processes the user's *previous* message in a conversation thread instead of the *current* (latest) message. This results in the N8N assistant seemingly repeating its response to an earlier query.

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

*   **Current State**: The application is largely functional due to the `isN8nProcessing` state variable, which fixed the primary issue of premature polling cessation and missing "Thinking" animations for N8N. However, this secondary bug of N8N occasionally processing a stale message persists.
*   **Risk of `experimental_prepareRequestBody`**: Previous attempts to implement `experimental_prepareRequestBody` (or similar significant refactors of the chat submission logic) in our application have led to instability and broken functionality. This path requires extreme caution and incremental steps if revisited.

## 6. Next Steps for Investigation

The immediate next step is to understand *why* the `useChat` hook in our client, during the problematic second submission, is sending a `messages` array to the backend that does not include the user's most recent input. This points to an issue in how the `input` state is captured or how the `messages` array is updated by `useChat` *before* the API call is made.

This will likely involve targeted client-side logging.

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

### 7.2. Required Changes (High-Level)

Implementing this would require changes in two main places:

1.  **`components/chat.tsx` (Client-side)**:
    *   Modify the `useChat` hook initialization to include the `experimental_prepareRequestBody` option.
    *   The function provided to this option will need to construct a request body that our `/api/chat` backend is prepared to handle. This typically includes the chat `id`, the `message` object (the latest one), and any other necessary parameters like `selectedChatModel`.

2.  **`app/(chat)/api/chat/route.ts` (Server-side)**:
    *   The backend route will need to be updated to expect this new request body structure. Instead of receiving a `messages: Array<UIMessage>`, it would receive a single `message: UIMessage` (or whatever structure `experimental_prepareRequestBody` defines).
    *   The logic for `getMostRecentUserMessage` would no longer be needed for the primary user input, as it's directly provided.
    *   The construction of the N8N payload would change:
        *   The `userMessage`, `messageId`, etc., would be derived directly from the incoming `body.message`.
        *   If the N8N workflow *requires* historical context, the `history` field for the N8N payload would need to be explicitly fetched from the database on the server-side (e.g., using `getMessagesByChatId(chatId)`), as the client would no longer be sending the full history with each request. (User has previously stated N8N only uses `userMessage`, which would simplify this, potentially removing the need to send `history` to N8N at all).

### 7.3. Benefits

*   **Bug Resolution**: This approach directly addresses the root cause of the stale message bug by making the "current message" explicit in the client-server communication.
*   **Alignment with Official Template**: Adopts a pattern used by the Vercel team, which is presumably more robust and has undergone more testing.
*   **Potentially Simpler Backend Logic**: The backend no longer needs to infer the latest user message from an array.

### 7.4. Risks & Considerations

*   **Previous Instability**: As noted, past attempts to implement this or similar significant refactors have caused issues. This requires a very careful, step-by-step implementation and thorough testing.
*   **Backend Changes**: Modifying the `/api/chat` route needs to be done carefully to ensure all functionalities (N8N model interaction, standard model interaction, message saving, title generation, etc.) continue to work correctly with the new request body structure.
*   **N8N History Requirement**: Clarity on whether N8N *truly* needs the `history` array in its payload is essential. If it does, implementing the server-side history fetch adds a step. If not, the N8N payload can be simplified.