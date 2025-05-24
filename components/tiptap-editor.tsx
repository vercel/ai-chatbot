'use client';

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import React, { useEffect, useRef } from 'react';

// Basic Props - Will be refined later
interface TiptapEditorProps {
  content: any; // Expecting Tiptap JSON
  onSaveContent: (updatedContent: any, debounce: boolean) => void; // Expecting Tiptap JSON
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  // Add other props as needed (e.g., suggestions)
  placeholder?: string;
}

export const TiptapEditor = ({
  content,
  onSaveContent,
  status,
  isCurrentVersion,
  placeholder = 'Start writing your rich text document...',
}: TiptapEditorProps) => {
  const isFirstRender = useRef(true);

  // Log the editable state
  console.log('[TiptapEditor] Rendering. isCurrentVersion:', isCurrentVersion);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // No configuration needed here for now
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false, // Prevent rendering raw HTML inserted via Markdown
        tightLists: true,
        linkify: true,
        breaks: true, // Convert soft breaks to <br>
        // transformPastedText: true, // Optional: Allow pasting Markdown
      }),
    ],
    // Start empty, content will be set via useEffect
    content: '',
    editable: isCurrentVersion,
    immediatelyRender: false,

    onUpdate({ editor }) {
      // Only save if it's the current version being edited
      if (isCurrentVersion) {
        const jsonContent = editor.getJSON();
        // TODO: Add debounce logic if needed, passing true might be premature
        onSaveContent(jsonContent, true);
      }
    },
  });

  // Effect to update editor if content prop changes *after* initialization
  useEffect(() => {
    if (!editor || !isCurrentVersion) {
      // If editor isn't ready or it's not the version to be edited, do nothing.
      // Or potentially set non-editable content for previous versions.
      return;
    }

    // Handle initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;

      console.log(
        'TiptapEditor: Received content prop (initial load):',
        content,
      );
      // Corrected: Directly use the content prop (Markdown string) if it exists,
      // otherwise default to empty content structure. Tiptap's setContent
      // with the Markdown extension should handle the string.
      const contentToSet = content || {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      };

      console.log(
        'TiptapEditor: Attempting to set initial content with:',
        contentToSet, // Log the actual value being passed
      );

      try {
        // Pass the Markdown string or default JSON structure
        editor.commands.setContent(contentToSet, false);
        console.log(
          'TiptapEditor: Successfully called setContent (initial). Current JSON:',
          JSON.stringify(editor.getJSON(), null, 2),
        );
      } catch (error) {
        console.error(
          'TiptapEditor: Error calling setContent (initial):',
          error,
        );
      }

      return; // Initial load handled
    }

    // --- Subsequent Updates (Streaming or Prop Changes) ---

    // Handle streaming updates (content is likely a full Markdown string)
    if (status === 'streaming' && typeof content === 'string') {
      try {
        // Avoid updating if content hasn't changed to prevent cursor jumps
        const currentEditorMarkdown =
          editor.storage.markdown?.getMarkdown() ?? editor.getText(); // Use getMarkdown if available
        if (content !== currentEditorMarkdown) {
          // Basic check
          console.log(
            'TiptapEditor: Updating content from streaming Markdown.',
            content,
          );
          // Let the Markdown extension parse the full string
          // Pass `true` to emitUpdate - we want saving to trigger if content changes
          editor.commands.setContent(content, true);
        }
        return; // Streaming update handled
      } catch (e) {
        console.error('TiptapEditor: Error setting streaming content.', e);
      }
    }

    // Handle non-streaming prop updates after initial load
    if (status !== 'streaming' && !isFirstRender.current) {
      let newContentToSet: JSONContent | string | null = null;
      let logMessage = '';

      if (typeof content === 'object' && content !== null) {
        newContentToSet = content as JSONContent;
        logMessage =
          'TiptapEditor: Setting content from non-streaming OBJECT prop update.';
      } else if (
        typeof content === 'string' &&
        content.trim().startsWith('{')
      ) {
        try {
          newContentToSet = JSON.parse(content);
          logMessage =
            'TiptapEditor: Setting content from non-streaming parsed JSON STRING prop update.';
        } catch (e) {
          console.error(
            'TiptapEditor: Error parsing non-streaming string prop as JSON.',
            content,
            e,
          );
          newContentToSet = content; // Fallback to setting as Markdown string
          logMessage =
            'TiptapEditor: Non-streaming string prop was not JSON, attempting Markdown set.';
        }
      } else if (typeof content === 'string') {
        newContentToSet = content;
        logMessage =
          'TiptapEditor: Setting content from non-streaming string prop (treating as Markdown).';
      }

      // Log the content attempting to be set
      console.log(
        '[TiptapEditor] Attempting to set content (prop update):',
        newContentToSet,
      );

      // Only set if content differs (simple check)
      if (
        newContentToSet &&
        // Simple stringify compare might be too naive for complex objects, but okay for now
        JSON.stringify(editor.getJSON()) !== JSON.stringify(newContentToSet)
      ) {
        // Log the full stringified object for inspection
        console.log(logMessage, JSON.stringify(newContentToSet, null, 2));
        try {
          // Don't trigger save/update when prop changes due to e.g. version switch
          editor.commands.setContent(newContentToSet, false);
          console.log(
            'TiptapEditor: Successfully called setContent (prop update). Current JSON:',
            JSON.stringify(editor.getJSON(), null, 2),
          );
        } catch (error) {
          console.error(
            'TiptapEditor: Error calling setContent (prop update):',
            error,
          );
        }
      }
    }
  }, [content, editor, status, isCurrentVersion]); // Add dependencies

  // Add a check to log editor state right before rendering EditorContent
  if (editor) {
    console.log(
      'TiptapEditor: State before rendering EditorContent:',
      JSON.stringify(editor.getJSON(), null, 2),
    );
  }

  return <EditorContent editor={editor} className="max-w-none" />;
};
