# Integrating n8n for Artifact Creation

This document outlines the strategy for enabling an n8n workflow, specifically an n8n-based AI assistant, to create artifacts (documents) within the existing application infrastructure.

## Current Artifact Creation
Artifacts are currently created via a `POST` request to the `/api/document` endpoint in the Next.js application. This endpoint:
1.  Authenticates the user via Clerk.
2.  Retrieves the user's internal profile ID (`User_Profiles.id`) based on their Clerk ID.
3.  Accepts `id` (for the document), `title`, `content`, `kind`, and `chatId` in the request body.
4.  Saves the document to the `Document` table in Supabase using the `saveDocument` database query, associating it with the internal user ID.

## n8n Integration Strategy for Artifact Creation

Given that the n8n assistant:
*   Possesses valid Clerk tokens for authentication.
*   Has its own internal "tools" or MCPs.
*   Can make HTTP requests.
*   Has direct Supabase database access (though direct writes for this are not recommended to avoid logic duplication).

The **recommended approach** is for the n8n assistant's "create artifact" tool to make a `POST` request directly to the existing `/api/document` endpoint in the Next.js application.

### Recommended Option: n8n Tool Calls Existing `/api/document` Endpoint

*   **Concept:** The n8n AI assistant, when deciding to create an artifact, will use an internal tool/step (likely an HTTP Request node) to call the `POST /api/document` endpoint.

*   **n8n Side (Setup for the "Create Artifact Tool"):**
    1.  **Trigger:** This would be part of your existing n8n AI assistant workflow when artifact creation is desired.
    2.  **Action (HTTP Request Node):**
        *   **Method:** `POST`
        *   **URL:** `https://<your_application_domain>/api/document?id=<generated_uuid_for_document>`
            *   A new UUID for the document ID should be generated within n8n before making the call and included as a query parameter.
        *   **Authentication:** `Header Auth`
        *   **Headers:**
            *   `Authorization`: `Bearer <Clerk_Token>` (The n8n workflow needs to dynamically insert the current user's valid Clerk token here).
            *   `Content-Type`: `application/json`
        *   **Body (JSON):**
            ```json
            {
              "title": "Taken from n8n input/AI context",
              "content": "Taken from n8n input/AI context",
              "kind": "text", // Or 'code', 'sheet', etc., from n8n input
              "chatId": "Taken from n8n input/AI context"
            }
            ```
    3.  **Error Handling:** Implement error handling in the n8n workflow to manage API response errors (e.g., 4xx, 5xx).

*   **Next.js Application Side:**
    *   **No code changes are required** for the `/api/document` route itself, as it's already set up to handle these requests with Clerk authentication.

*   **Pros:**
    *   **Reuses Existing Logic:** Leverages the existing, tested API endpoint, including its authentication, user profile lookup, and data saving mechanisms.
    *   **Centralized Business Logic:** Keeps the core logic for document creation within the Next.js application, making it easier to maintain and update. The API acts as the single source of truth for how documents are created.
    *   **Secure:** Uses the standard Clerk authentication flow.
    *   **Simplicity:** Avoids creating new AI tools in the Next.js app just for n8n to call, and avoids n8n needing to duplicate database interaction logic.

### Alternative Options Considered (and why they are less ideal now):

1.  **New AI Tool in Next.js calls an n8n Webhook (n8n then writes to Supabase):**
    *   This would involve defining a `tool` in `lib/ai/tools/` in the Next.js app. The tool's `execute` function would call an n8n webhook. n8n would then use its Supabase node to save the document.
    *   *Less Ideal Because:* If the n8n assistant is already the one making decisions and has its own tools, having the Next.js app call n8n (which then acts) is an unnecessary intermediary step. The n8n assistant can act more directly.

2.  **n8n Tool Writes Directly to Supabase `Document` Table:**
    *   n8n could use its Supabase node to directly insert data into the `Document` table.
    *   *Less Ideal Because:*
        *   **Bypasses Business Logic:** It would skip the Clerk authentication and, more importantly, the logic in `/api/document` that looks up the internal `User_Profiles.id` using the `clerkUserId`. Replicating this user ID lookup accurately in n8n would be crucial and would mean duplicating logic that already exists and is maintained in the Next.js API.
        *   **Maintenance Overhead:** If document creation rules or associated logic change, updates would be needed in both the Next.js API (if still used elsewhere) and the n8n workflow.

## Conclusion
The most straightforward and robust method is for the n8n assistant's internal tool to make an authenticated `POST` request to the existing `/api/document` endpoint. This approach ensures that all artifact creation goes through the established and secure pathway, maintaining consistency and leveraging existing code. 

## Frontend UI Update for n8n-Created Artifacts

When the n8n assistant creates a document by calling the `/api/document` endpoint, the backend successfully creates the document. However, the frontend chat UI needs a mechanism to be notified to display this newly created artifact, similar to how it might display artifacts created by internal AI tools.

Here's the process:

1.  **API Response to n8n:**
    *   The `POST /api/document` endpoint, upon successful document creation, returns a JSON response containing the details of the newly created document (e.g., `id`, `title`, `kind`, `chatId`). This is already the current behavior: `Response.json(document, { status: 200 })`.

2.  **n8n Sends a Signal to the Frontend via Chat Message:**
    *   After the n8n workflow receives the successful JSON response from the `/api/document` call, it must formulate its next message back to the chat UI. This message needs to include a special instruction or payload that the frontend can identify.
    *   **Option A (Preferred - Structured UI Command):** If the messaging system piping n8n's responses to the chat UI supports custom message objects, n8n should send an object like:
        ```json
        {
          "role": "assistant", // Or a specific role for n8n
          "id": "n8n_message_id",
          "content": "I've created the document: 'Document Title'.", // Regular text
          "ui_command": { // Custom field name
            "type": "displayArtifact", // Identifier for the action
            "data": { // Payload from the API response
              "id": "document_id_from_api",
              "title": "Document Title",
              "kind": "text"
              // ... other necessary details ...
            }
          }
        }
        ```
    *   **Option B (Fallback - Special String Marker):** If n8n can only send plain text, it can embed a recognizable marker and JSON payload within the text:
        `I've created the document: 'Document Title'. [DISPLAY_ARTIFACT:{"id":"document_id_from_api", "title":"Document Title", "kind":"text"}]`

3.  **Frontend Chat UI Handles the Signal:**
    *   The Next.js frontend chat message rendering logic needs to be updated:
        *   **For Option A:** Check incoming message objects for the `ui_command` field. If `message.ui_command` is not `null` and `message.ui_command.type === "displayArtifact"`, extract `message.ui_command.data` and pass it to the existing JavaScript function or React component that handles the full-screen display of artifacts.
        *   **For Option B (Fallback - Special String Marker):** Parse the text content of incoming messages for the `[DISPLAY_ARTIFACT:{...}]` pattern. If found, extract and parse the JSON, then use the data to trigger the artifact display.

This ensures that the frontend can react to document creation events initiated by n8n, providing a consistent user experience.

### Recommended Message Structure for n8n

Given that an n8n AI agent might execute multiple tools in sequence or parallel for a single user turn before formulating its final response, the most robust way to handle the `ui_command` is as follows:

1.  **Consistent Message Structure:** The n8n workflow should always include the `ui_command` field in the final JSON message object it sends to the chat UI.

2.  **Workflow Variable for `ui_command` Payload:**
    *   At the beginning of the n8n workflow that orchestrates AI tool calls for a user's turn, initialize a workflow variable (e.g., using a "Set" node or in an initial script): `flow.ui_command_data_for_turn = null`.

3.  **Artifact Creation Tool Populates the Variable:**
    *   When the specific n8n internal tool responsible for creating an artifact (which calls the Next.js `/api/document` endpoint) executes successfully and receives the document details from the API:
        *   This tool should update the `flow.ui_command_data_for_turn` variable with the necessary structured data. For example: `flow.ui_command_data_for_turn = { "type": "displayArtifact", "data": { "id": "...", "title": "...", ... } }`.
    *   If multiple artifacts are created in a turn and all need to be signaled, this variable could be designed to hold an array of commands.

4.  **Other n8n Tools:** Other tools executed by the n8n agent during the same turn do *not* modify `flow.ui_command_data_for_turn`.

5.  **Final Message Construction by n8n:**
    *   The n8n node that constructs the final JSON message to be sent back to the chat UI will use this workflow variable:
        ```json
        {
          "role": "assistant", // Or your specific n8n role
          "id": "n8n_turn_identifier",
          "content": "The AI's textual response for the turn...",
          "ui_command": {{ flow.ui_command_data_for_turn }} // Directly embeds the variable
        }
        ```
    *   If no artifact creation tool ran (or it failed before updating the variable), `ui_command` will be `null`.
    *   If an artifact was created, `ui_command` will contain the object needed by the frontend.

**Frontend Logic Adaptation:**

*   The frontend JavaScript/React code that processes incoming messages will check:
    ```javascript
    if (message.ui_command && message.ui_command.type === 'displayArtifact') {
        // Process the UI command and display the artifact
        // using message.ui_command.data
    }
    // Always render the message.content (if present)
    ```
This approach simplifies the n8n workflow logic by not requiring a complex check of tool call history at the end of the turn. The responsibility for signaling a UI action is localized to the tool that performs the action. 