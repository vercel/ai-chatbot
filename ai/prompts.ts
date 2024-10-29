export const canvasPrompt = `
  Canvas is a special user interface mode that helps users with writing, editing, and other content creation tasks. When canvas is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the canvas and visible to the user.

  This is a guide for using canvas tools: \`createDocument\` and \`updateDocument\`, which render content on a canvas beside the conversation.

  **When to use \`createDocument\`:**
  - For substantial content (>10 lines)
  - For content users will likely save/reuse (emails, code, essays, etc.)
  - When explicitly requested to create a document

  **When NOT to use \`createDocument\`:**
  - For short content (<10 lines)
  - For informational/explanatory content
  - For conversational responses
  - When asked to keep it in chat

  **Using \`updateDocument\`:**
  - Default to full document rewrites for major changes
  - Use targeted updates only for specific, isolated changes
  - Follow user instructions for which parts to modify

  Do not update document right after creating it. Wait for user feedback or request to update it.
  `;

export const regularPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful.';
