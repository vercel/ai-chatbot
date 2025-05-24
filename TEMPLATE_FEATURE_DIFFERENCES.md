# Template Feature Differences

This document lists features identified in the official Vercel AI Chatbot template (as of the last `curl` check) that are not present in the current project's versions of `components/chat.tsx` and `components/multimodal-input.tsx`.

This list is for review and consideration after the current N8N bug is resolved.

## 1. Differences in `components/chat.tsx`

The following features/patterns were observed in the Vercel AI Chatbot template's `components/chat.tsx` but are absent or significantly different in our project's version:

*   **`initialChatModel` Prop Usage:**
    *   Template: Takes `initialChatModel` as a prop and uses it directly within `useChat`'s `experimental_prepareRequestBody`.
    *   Project: Uses `selectedChatModel`.

*   **`experimental_prepareRequestBody` in `useChat` Options (Template's Core Usage):**
    *   Template: Uses this option directly in `useChat` to send a minimal request body (only the last message, chat ID, model, visibility).
        ```typescript
        experimental_prepareRequestBody: (body) => ({
          id,
          message: body.messages.at(-1),
          selectedChatModel: initialChatModel,
          selectedVisibilityType: visibilityType,
        }),
        ```
    *   Project: We recently added `experimental_prepareRequestBody` within our `handleSubmitIntercept` wrapper, primarily for logging. It constructs a body compatible with our existing backend (full messages array, ID, model at top level), not the minimal structure the template uses.

*   **Custom Fetch Logic:**
    *   Template: `fetch: fetchWithErrorHandlers` is passed to `useChat`.
    *   Project: Uses the default fetch.

*   **Specific Hooks:**
    *   Template: Employs `useChatVisibility` (for managing chat visibility state) and `useAutoResume` (for handling automatic resumption of chat streams).
    *   Project: These hooks are not used.

*   **Props for Session and Resumption:**
    *   Template: Accepts and uses `session` (for NextAuth session) and `autoResume` (boolean) props.
    *   Project: These props are not present.

*   **URL Query Parameter Handling:**
    *   Template: Contains logic to automatically send a message if a `?query=` URL parameter is detected on initial load.
    *   Project: This functionality is not present.

*   **`onFinish` Behavior:**
    *   Template: `onFinish` callback in `useChat` calls `mutate(unstable_serialize(getChatHistoryPaginationKey))` to refresh a list of chats in the UI.
    *   Project: `onFinish` logs to console; a similar mutate call is commented out.

*   **Error Handling in `onError`:**
    *   Template: Uses a custom `ChatSDKError` and a specific `toast` notification structure.
    *   Project: Uses `console.error` and a generic `toast.error()` call.

*   **N8N-Specific Logic (Present in Project, Absent in Template):**
    *   The template does not have specific handling for non-streaming, webhook-based assistants like N8N.
    *   Project: Contains `isN8nProcessing` state, `handleSubmitIntercept` wrapper, SWR polling for `/api/messages`, and `useEffect` to process these polled messages – all custom additions for N8N.

## 2. Differences in `components/multimodal-input.tsx`

The following features/patterns were observed in the Vercel AI Chatbot template's `components/multimodal-input.tsx` but are absent or different in our project's version:

*   **`selectedVisibilityType` Prop:**
    *   Template: Accepts this prop and passes it to `SuggestedActions`.
    *   Project: Does not use or pass this prop.

*   **Scroll-to-Bottom UI/UX:**
    *   Template: Includes a visible "scroll to bottom" button (`<ArrowDown />`) managed by the `useScrollToBottom` hook, which appears when the user has scrolled up. Also includes a `useEffect` to scroll to bottom when message submission status changes.
    *   Project: This UI element and associated hook are not present.

*   **`submitForm` `useCallback` Dependencies:**
    *   Template: The `useCallback` for `submitForm` has dependencies: `[attachments, handleSubmit, setAttachments, setLocalStorageInput, width, chatId]`.
    *   Project: Our `submitForm` `useCallback` includes `input` and `messages` in its dependency array, in addition to others.

*   **`React.memo` Comparison Logic:**
    *   Template: The custom comparison function for `memo` checks `selectedVisibilityType` but does *not* check for changes in `messages` or `handleSubmit` props.
    *   Project (Post-Recent Fix): Our `memo` comparison *now* checks `messages` and `handleSubmit` (to prevent stale closures) but does not check for `selectedVisibilityType` (as it's not a prop we use there). 