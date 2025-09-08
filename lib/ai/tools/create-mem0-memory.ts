import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod/v4';
import type { ChatMessage, Session } from '@/lib/types';
import { ChatSDKError } from '@/lib/errors';
import { createMem0Client } from '@/lib/mem0/client';

interface CreateMem0MemoryProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const createMem0Memory = ({
  session,
  dataStream,
}: CreateMem0MemoryProps) =>
  tool({
    description:
      'Creates a new memory in a Mem0 project. The user ID is automatically determined from the authenticated session.',
    inputSchema: z.object({
      projectId: z
        .string()
        .describe('The ID of the Mem0 project to add the memory to'),
      messages: z
        .array(
          z.object({
            role: z
              .enum(['user', 'assistant'])
              .describe('The role of the message sender'),
            content: z.string().describe('The content of the message'),
          }),
        )
        .min(1)
        .describe(
          'Array of messages to create a memory from (at least 1 message required)',
        ),
      metadata: z
        .record(z.string(), z.any())
        .optional()
        .describe('Optional metadata to associate with the memory'),
    }),
    execute: async ({ projectId, messages, metadata }) => {
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

        if (!projectId) {
          throw new ChatSDKError(
            'bad_request:chat',
            'Project ID is required to create a memory.',
          );
        }

        // Use the WorkOS user ID automatically - this cannot be overridden
        const userId = session.user.id;

        const client = createMem0Client();

        // Add metadata to include session info
        const enhancedMetadata = {
          ...metadata,
          created_by_email: session.user.email,
          created_by_name: session.user.name || undefined,
          created_at: new Date().toISOString(),
        };

        const memory = await client.addProjectMemory(projectId, {
          messages,
          user_id: userId,
          metadata: enhancedMetadata,
        });

        const result = {
          memory: memory,
          projectId: projectId,
          userId: userId,
          created: true,
          messageCount: messages.length,
          timestamp: new Date().toISOString(),
        };

        const disclaimer =
          'Below is the result of creating a new Mem0 memory. The memory has been associated with your user ID and stored in the specified project.';
        const boundaryId = `mem0-memory-created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const wrappedResult = `${disclaimer}\n\n<${boundaryId}>\n${JSON.stringify(result, null, 2)}\n</${boundaryId}>\n\nThe memory has been successfully created and associated with user ID: ${userId}.`;

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
          errorMessage.includes('project not found') ||
          errorMessage.includes('invalid project')
        ) {
          throw new ChatSDKError(
            'bad_request:chat',
            `Project with ID "${projectId}" not found. Please verify the project ID exists.`,
          );
        }

        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          throw new ChatSDKError(
            'rate_limit:chat',
            'Mem0 API quota exceeded. Please try again later.',
          );
        }

        throw new ChatSDKError(
          'bad_request:chat',
          `Failed to create Mem0 memory: ${errorMessage}`,
        );
      }
    },
  });
