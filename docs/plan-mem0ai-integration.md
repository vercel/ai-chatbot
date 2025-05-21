# Plan: Mem0.ai Integration for Persistent User Memory

## Checklist

*   🟢 **Goal Definition:** Define the objective of integrating Mem0.ai.
*   🟢 **Identify Service:** Note `mem0ai` as the target service for persistent memory.
*   🟢 **Review Mem0.ai Docs:** Examine provided JS/TS examples and web search results.
*   🟢 **Dependency Installed:** Confirm `pnpm install -w mem0ai` was executed.
*   🟢 **API Key Setup:** Outline steps for `.env.local` and Vercel environment variable.
*   🟡 **Code Integration - Init:** Add `MemoryClient` import and initialization in `app/(chat)/api/chat/route.ts`.
*   🟡 **Code Integration - User ID:** Confirm `userId` (Profile UUID) is correctly identified for Mem0.
*   🟡 **Code Integration - Retrieval:** Implement `mem0Client.search()` before `streamText`.
*   🟡 **Code Integration - Injection:** Implement logic to prepend retrieved memory to the system prompt.
*   🟡 **Code Integration - Storage:** Implement `mem0Client.add()` in `onFinish` callback.
*   🔴 **Code Integration - Error Handling:** Add robust `try...catch` blocks for Mem0 calls.
*   🟡 **Testing Strategy - Define:** Outline environment checks, optional integration tests, and manual E2E scenarios.
*   🔴 **Testing Strategy - Execute:** Perform manual E2E tests locally and on preview.
*   🟡 **Rollout Plan - Define:** Outline steps from development branch to production monitoring.
*   🔴 **Rollout Plan - Execute:** Deploy to preview, test, merge, deploy production, monitor.

*(**Legend:** 🔴 = Not Started, 🟡 = In Progress, 🟢 = Done)*

---

## 1. Goal

Integrate the `mem0ai` service to provide persistent, long-term memory for users across different chat sessions. This will allow the assistant to recall user-specific preferences, facts, and past interaction summaries, leading to more personalized, contextually relevant, and efficient conversations.

## 2. Problem Summary

Currently, the chatbot has no long-term memory specific to individual users. Each chat session starts with a clean slate (aside from the immediate context window passed to the LLM). The assistant cannot remember details like user preferences ("I'm vegetarian"), past requests, or personal facts ("My name is Alex") mentioned in previous, separate chat sessions. This limits personalization and can lead to repetitive interactions.

## 3. Integration Strategy

1.  **Setup:** Securely configure the `MEM0_API_KEY` in local and production environments.
2.  **Initialization:** Import and initialize the `mem0ai` `MemoryClient` within the primary chat API route (`app/(chat)/api/chat/route.ts`).
3.  **Identify User:** Ensure the correct, persistent user identifier (the `User_Profiles.id` UUID) is available within the API route context to associate memories correctly.
4.  **Retrieve Context:** Before generating an AI response (`streamText` call), query Mem0 using `client.search()` with the current user's message and their `userId` to fetch relevant past memories.
5.  **Inject Context:** Format the retrieved memories and prepend them to the system prompt sent to the language model, providing it with relevant historical context.
6.  **Store Interaction:** After the AI response is generated (`onFinish` callback), store the latest user message and the assistant's response in Mem0 using `client.add()`, associated with the `userId`.
7.  **Error Handling:** Implement graceful error handling so that failures in Mem0 API calls log the error but do not interrupt the core chat functionality.
8.  **Testing:** Define and execute comprehensive testing scenarios, including storing/retrieving preferences across sessions and handling API errors.
9.  **Rollout:** Follow a standard development workflow: feature branch -> preview deployment -> testing -> merge -> production deployment -> monitoring.

## 4. Detailed Analysis: Code Implementation (`app/(chat)/api/chat/route.ts`)

*   **Dependencies:** `mem0ai` SDK is installed.
*   **Initialization:**
    ```typescript
    import MemoryClient from 'mem0ai';

    const mem0Client = process.env.MEM0_API_KEY ? new MemoryClient({ apiKey: process.env.MEM0_API_KEY }) : null;
    if (!mem0Client) {
        console.warn("MEM0_API_KEY not found. Mem0.ai features disabled.");
    }
    ```
    *   Place this at the module level for reuse.
*   **User ID:** The existing logic correctly retrieves the `userId` (profile UUID) from the authenticated Clerk user. This ID will be used for `user_id` in Mem0 calls.
*   **Memory Retrieval (`client.search`) Implementation:**
    *   Occurs after user authentication and before `streamText`.
    *   Uses `userMessage.content` as the query.
    *   Passes `{ user_id: userId, limit: 7 }` (or similar limit). **Mem0 internally uses a hybrid search approach (combining vector, keyword, and potentially graph-based retrieval) across its data stores and applies relevance scoring (recency, significance) to return the most pertinent memories within the specified limit.**
    *   Requires `await` and `try...catch`.
    *   Example result formatting:
        ```typescript
        // No manual truncation needed; rely on Mem0's relevance scoring and limit.
        const memories = searchResults?.memories?.map(mem => {
          // Format the memory text as needed for the prompt
          return `Recall from past conversation: ${mem.text}`;
        }).join('\n\n') || '';
        ```
*   **Context Injection Implementation:**
    *   Modify the `messages` array passed to `streamText`.
    *   Find the system prompt (or use default).
    *   Prepend `memories` to the system prompt string.
    *   Example: `const systemPromptWithMemory = memories ? \`$\{memories\}\\n\\n$\{baseSystemPrompt\}\` : baseSystemPrompt;`
*   **Memory Storage (`client.add`) Implementation:**
    *   Occurs within the `onFinish` callback of `streamText`.
    *   Requires `await` and `try...catch`.
    *   Constructs message array: `[{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]`. Handle potential non-string user content.
    *   Passes message array and `{ user_id: userId }`.
*   **API Key:** Relies on `process.env.MEM0_API_KEY` being correctly configured.

## 5. Potential Challenges & Considerations

*   **API Rate Limits/Costs:** Understand and monitor Mem0.ai usage for potential rate limits or costs associated with API calls.
*   **Memory Relevance:** The effectiveness depends on Mem0.ai's ability to retrieve *relevant* memories via its hybrid search. The quality of the `search` query (currently just the user message) might need refinement. Relying on the `limit` parameter and Mem0's internal scoring is key.
*   **Context Window:** Adding retrieved memories to the prompt consumes context window space for the main LLM call. Monitor token usage, although Mem0's internal ranking should help optimize relevance.
*   **Data Privacy:** Ensure compliance with privacy policies regarding storing user conversation snippets externally.
*   **Error Handling Strategy:** Decide if Mem0 failures should be silent (log only) or if users should be notified (unlikely desirable). Current plan is log-only.
*   **Complex Content:** Storing messages with non-text parts (images) requires deciding how to represent them in Mem0's text-based memory (e.g., store image description or omit).

## 6. Testing Scenarios (Manual E2E)

*   **Scenario 1: Store Preference:** User states preference (e.g., "I hate cilantro"). Verify logs show `client.add` success.
*   **Scenario 2: Recall Preference (Same Session):** User asks related question (e.g., "Suggest a Mexican dish"). Verify AI avoids cilantro.
*   **Scenario 3: Recall Preference (New Session):** Close tab, new chat, ask related question. Verify AI *still* avoids cilantro. Check logs for `client.search` retrieving memory.
*   **Scenario 4: No Memory:** New user asks generic question. Verify normal response, logs show `search` called but likely returned nothing.
*   **Scenario 5: API Error:** Simulate API key failure. Verify chat works, memory fails, logs show Mem0 errors.

## 7. Recommendation

Proceed with the integration strategy outlined above, implementing the code changes in `app/(chat)/api/chat/route.ts`. Prioritize robust logging and graceful error handling. Conduct thorough manual E2E testing covering the defined scenarios before merging to production. Monitor performance and context window usage post-deployment. 