# TextV2 Artifact Rendering Discrepancy

## Observation

The content of `textv2` artifacts appears better formatted (e.g., richer styling, correct layout) when viewed in the maximized artifact panel compared to the inline preview displayed within the chat message list.

## Cause

This discrepancy arises from different rendering components being used in the two contexts:

1.  **Maximized View (`artifacts/textv2/client.tsx`):** This component likely uses a full Tiptap editor instance initialized with the necessary extensions to correctly render the rich text structure derived from the saved Markdown (`content` field).
2.  **Inline Preview (`components/document-preview.tsx` -> `DocumentContent` component):** This component currently uses the basic `<Markdown>` component (`components/markdown.tsx`) to render the preview for `textv2` artifacts. This basic component provides standard Markdown-to-HTML conversion but lacks the specific Tiptap extensions and styling applied in the maximized view.

## Solution

To achieve consistent formatting, the `DocumentContent` component within `components/document-preview.tsx` needs to be updated. Instead of rendering `textv2` artifacts using `<Markdown>`, it should use a dedicated, read-only Tiptap-based rendering component configured with the same relevant extensions as the main editor used in the maximized view. This component would take the Markdown string from the `document.content` field as input. 