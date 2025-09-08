import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod/v4';
import type { ChatMessage, Session } from '@/lib/types';
import { ChatSDKError } from '@/lib/errors';
import { createMem0Client } from '@/lib/mem0/client';

interface CreateMem0ProjectProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const createMem0Project = ({
  session,
  dataStream,
}: CreateMem0ProjectProps) =>
  tool({
    description: 'Creates a new Mem0 project for organizing memories.',
    inputSchema: z.object({
      name: z
        .string()
        .min(1)
        .max(100)
        .describe('The name of the project to create'),
      description: z
        .string()
        .optional()
        .describe('Optional description for the project'),
    }),
    execute: async ({ name, description }) => {
      try {
        if (!session?.user?.email) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'No user email in session',
          );
        }
        // if (session?.role !== 'org-developer') {
        //   throw new ChatSDKError(
        //     'forbidden:chat',
        //     'Access denied. Developer role required for Mem0 operations.',
        //   );
        // }

        const client = createMem0Client();
        const project = await client.createProject(name, description);

        const result = {
          project: project,
          created: true,
          timestamp: new Date().toISOString(),
        };

        const disclaimer =
          'Below is the result of creating a new Mem0 project. Use this project ID to create memories within this project.';
        const boundaryId = `mem0-project-created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const wrappedResult = `${disclaimer}\n\n<${boundaryId}>\n${JSON.stringify(result, null, 2)}\n</${boundaryId}>\n\nThe project has been successfully created. You can now use this project ID to organize memories.`;

        return {
          result: wrappedResult,
        };
      } catch (error) {
        if (error instanceof ChatSDKError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (
          errorMessage.includes('MEM0_API_KEY') ||
          errorMessage.includes('MEM0_ORG_ID')
        ) {
          throw new ChatSDKError(
            'bad_request:chat',
            'Mem0 API credentials not configured. Please check your environment variables.',
          );
        }

        if (
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate')
        ) {
          throw new ChatSDKError(
            'bad_request:chat',
            `Project with name "${name}" already exists. Please choose a different name.`,
          );
        }

        throw new ChatSDKError(
          'bad_request:chat',
          `Failed to create Mem0 project: ${errorMessage}`,
        );
      }
    },
  });
