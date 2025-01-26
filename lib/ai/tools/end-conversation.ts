import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';


interface EndConversationProps {
  dataStream: DataStreamWriter;
}

export const endConversation = ({
  dataStream,
}: EndConversationProps) =>
  tool({
    description: 'Generate a final summary when the conversation is ending, formatting the aircraft issue details in markdown.',
    parameters: z.object({
      aircraft_type: z.string().describe('The type/model of aircraft involved'),
      squawk_details: z.string().describe('Details of the reported issue/squawk'),
      conversation_summary: z.string().describe('Summary of the conversation and troubleshooting steps'),
    }),
    execute: async ({ aircraft_type, squawk_details, conversation_summary }) => {
      try {
        console.log('endConversation tool called');
        const markdown = `
# Aircraft Maintenance Report

## Aircraft Type
${aircraft_type}

## Squawk Details
${squawk_details}

## Conversation Summary
${conversation_summary}

---
Report generated on ${new Date().toLocaleString()}`;
// dataStream.writeData({
//   type: 'text-delta',
//   content: markdown,
// });
        // Return the content without writing to dataStream directly
        return {
          content: markdown
        };
      } catch (error) {
        console.error('Error in endConversation tool:', error);
        throw error;
      }
    },
  });




