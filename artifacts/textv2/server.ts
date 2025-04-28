import { smoothStream, streamText, type CoreMessage } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import type { JSONContent } from '@tiptap/react';
import { generateJSON } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Code from '@tiptap/extension-code';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import HardBreak from '@tiptap/extension-hard-break';
import { marked } from 'marked';

// Define the minimal server-safe extensions
const ServerExtensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Code, // For inline code
  BulletList,
  ListItem,
  OrderedList,
  HardBreak, // Handle newlines/breaks correctly
];

// Type for the return value of the handlers
interface TextV2Content {
  markdown: string;
  json: JSONContent;
}

// Utility to convert Markdown to Tiptap JSON using minimal server-safe extensions
async function markdownToTiptapJson(markdown: string): Promise<JSONContent> {
  console.log('[markdownToTiptapJson] Attempting conversion...'); // Log start
  if (!markdown.trim()) {
    console.log('[markdownToTiptapJson] Input is empty, returning empty doc.');
    return { type: 'doc', content: [{ type: 'paragraph' }] }; // Return empty doc for empty input
  }
  try {
    console.log('[markdownToTiptapJson] Parsing Markdown...');
    // Allow GFM line breaks
    const html = await marked.parse(markdown, { breaks: true });
    console.log('[markdownToTiptapJson] Generating JSON from HTML...');
    // Use the minimal ServerExtensions instead of StarterKit
    const json = generateJSON(html, ServerExtensions);
    console.log('[markdownToTiptapJson] Conversion successful.');
    return json;
  } catch (error) {
    console.error('[markdownToTiptapJson] Error during conversion:', error);
    // Fallback to a simple paragraph with the original markdown on error
    return {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: markdown }] },
      ],
    };
  }
}

const emptyTiptapJSON: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

export const textV2DocumentHandler = createDocumentHandler<'textv2'>({
  kind: 'textv2',
  onCreateDocument: async ({ title, dataStream, userId, instructions }) => {
    console.log(
      `[textV2 onCreateDocument] Generating content for title: "${title}"`,
    );

    // Use instructions in system prompt
    const systemContent = `You are an expert writer. Generate the main content for a document based on the provided title. Respond only with the content itself in Markdown format. Do not include the title in your response. ${instructions ? `IMPORTANT: Adhere to the following user instructions: ${instructions}` : ''}`;

    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: systemContent,
      },
      {
        role: 'user',
        content: `Title: ${title}`,
      },
    ];

    try {
      const result = await streamText({
        model: myProvider.languageModel('artifact-model'),
        messages,
      });

      console.log(
        '[textV2 onCreateDocument] streamText result object:',
        result,
      );

      let fullResponse = '';
      console.log(
        '[textV2 onCreateDocument] Entering stream aggregation loop...',
      );
      // Aggregate the stream and forward text deltas
      for await (const delta of result.textStream) {
        // --- Log Delta Start ---
        console.log(
          '[textV2 onCreateDocument] Received delta:',
          JSON.stringify(delta),
        );
        // --- Log Delta End ---
        try {
          if (typeof delta === 'string') {
            fullResponse += delta;
            console.log('[textV2 onCreateDocument] Received delta:', delta);
            // dataStream.writeData({ type: 'text-delta', content: delta }); // Keep this commented out for now
          }
        } catch (error) {
          console.error(
            '[textV2 onCreateDocument] Error processing delta:',
            error,
          );
        }
      }
      console.log('[textV2 onCreateDocument] Exited stream aggregation loop.');
      console.log('[textV2 onCreateDocument] Finished streaming AI content.');
      console.log(
        '[textV2 onCreateDocument] Full streamed response before conversion:',
        fullResponse,
      ); // Log the full response

      // Convert Markdown to JSON
      console.log('[textV2 onCreateDocument] Converting Markdown to JSON...');
      const jsonContent = await markdownToTiptapJson(fullResponse);
      console.log('[textV2 onCreateDocument] Conversion complete.');

      // Return both formats
      return {
        markdown: fullResponse,
        json: jsonContent,
      };
    } catch (error) {
      console.error(
        '[textV2 onCreateDocument] Error generating content:',
        error,
      );
      dataStream.writeData({
        type: 'error',
        content: 'Failed to generate document content.',
      });
      // Return empty content in both formats on error
      return {
        markdown: '',
        json: emptyTiptapJSON,
      };
    }
  },
  onUpdateDocument: async ({
    document,
    description,
    dataStream,
    userId,
    instructions,
  }) => {
    console.log(
      `[textV2 onUpdateDocument] Updating document ID: ${document.id} with description: "${description}"`,
    );
    // Use the existing content (as Markdown string) from the document
    // Provide an empty string fallback if content is null/undefined
    const currentContent = document.content ?? '';

    // Use instructions in system prompt
    const systemContent = `You are an expert editor. Update the provided document based on the user request. Respond only with the complete, updated document content in Markdown format. Preserve existing formatting where appropriate. ${instructions ? `IMPORTANT: Also adhere to the following user instructions for this update: ${instructions}` : ''}`;

    // Define the prompt for the AI, including existing content and the update instruction
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: systemContent,
      },
      {
        role: 'user',
        content: `Update Request: ${description}\n\nExisting Document Content:\n---\n${currentContent}`,
      },
    ];

    let fullResponse = '';
    // Removed jsonContent variable declaration

    try {
      console.log('[textV2 onUpdateDocument] Calling streamText...');
      const result = await streamText({
        model: myProvider.languageModel('artifact-model'), // Use the same model
        messages,
      });
      console.log('[textV2 onUpdateDocument] streamText call finished.');

      // Aggregate the stream and forward text deltas
      console.log(
        '[textV2 onUpdateDocument] Entering stream aggregation loop...',
      );
      for await (const delta of result.textStream) {
        // --- Log Delta Start ---
        console.log(
          '[textV2 onUpdateDocument] Received delta:',
          JSON.stringify(delta),
        );
        // --- Log Delta End ---
        try {
          if (typeof delta === 'string') {
            fullResponse += delta;
            dataStream.writeData({ type: 'text-delta', content: delta });
          }
        } catch (error) {
          console.error(
            '[textV2 onUpdateDocument] Error processing delta:',
            error,
          );
        }
      }
      console.log(
        '[textV2 onUpdateDocument] Finished streaming updated AI content.',
      );

      // Skip server-side JSON conversion
      console.log(
        '[textV2 onUpdateDocument] Skipping server-side JSON conversion.',
      );

      // Return markdown only, setting json to null
      console.log(
        '[textV2 onUpdateDocument] Returning success object (markdown only).',
      );
      return {
        markdown: fullResponse,
        json: null, // Explicitly return null for JSON
      };
    } catch (error) {
      console.error(
        '[textV2 onUpdateDocument] Error during update process:',
        error,
      );
      dataStream.writeData({
        type: 'error',
        content: 'Failed to update document content.',
      });
      // Return original markdown content and null JSON on error
      console.log(
        '[textV2 onUpdateDocument] Returning original markdown and null JSON after error.',
      );
      return {
        markdown: currentContent, // Return original markdown on error
        json: null, // Return null JSON on error
      };
    }
  },
});
