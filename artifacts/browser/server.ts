import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const browserDocumentHandler = createDocumentHandler<'browser'>({
  kind: 'browser',
  
  onCreateDocument: async ({ title, dataStream, id }) => {
    // Generate a unique session ID for this browser artifact
    const sessionId = `browser-${id}-${Date.now()}`;
    
    // Create initial content describing the browser session
    let draftContent = '';
    
    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: `You are creating a browser automation session. Generate a brief description of what this browser session will be used for based on the title: "${title}".
      
      Keep it concise and professional. Include:
      - Purpose of the browser session
      - Expected automation tasks
      - Session identifier: ${sessionId}
      
      Format as markdown.`,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: `Create browser automation session: ${title}`,
    });

    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        draftContent += delta.text;
        dataStream.write({
          type: 'data-textDelta',
          data: delta.text,
          transient: true,
        });
      }
    }

    // Add session metadata to content
    const sessionMetadata = `

## Session Information
- **Session ID**: \`${sessionId}\`
- **Created**: ${new Date().toISOString()}
- **Status**: Initializing
- **Connection**: Ready for browser automation

---

*This browser session is ready for web automation tasks. The live browser view will appear when automation begins.*`;

    draftContent += sessionMetadata;
    
    dataStream.write({
      type: 'data-textDelta',
      data: sessionMetadata,
      transient: true,
    });

    return draftContent;
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';
    
    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: `You are updating a browser automation session document. 
      
      The current document contains information about a browser automation session. 
      Update it based on the user's request while preserving the session information and adding relevant details.
      
      Current content:
      ${document.content}
      
      User request: ${description}
      
      Maintain the session metadata section and update other content as needed.
      Format as markdown.`,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      providerOptions: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        draftContent += delta.text;
        dataStream.write({
          type: 'data-textDelta',
          data: delta.text,
          transient: true,
        });
      }
    }

    // Add timestamp for the update
    const updateNote = `

*Updated: ${new Date().toISOString()}*`;
    
    draftContent += updateNote;
    
    dataStream.write({
      type: 'data-textDelta',
      data: updateNote,
      transient: true,
    });

    return draftContent;
  },
});
