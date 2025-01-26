import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { Model } from '../models';

interface EndConversationProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const endConversation = ({
  model,
  session,
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

      // Stream the markdown content
      dataStream.writeData({
        type: 'text-delta',
        content: markdown,
      });

      dataStream.writeData({
        type: 'finish',
        content: '',
      });

      return {
        content: 'Maintenance report has been generated.',
        markdown: markdown
      };
    },
  });




