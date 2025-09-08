import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod/v4';
import type { ChatMessage, Session } from '@/lib/types';
import { ChatSDKError } from '@/lib/errors';
import { createMem0Client } from '@/lib/mem0/client';

interface GetMem0MemoriesProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const getMem0Memories = ({
  session,
  dataStream,
}: GetMem0MemoriesProps) =>
  tool({
    description:
      'Retrieves memories from a specific Mem0 project, optionally filtered by search query or user ID.',
    inputSchema: z.object({
      projectId: z
        .string()
        .describe('The ID of the Mem0 project to retrieve memories from.'),
      query: z
        .string()
        .optional()
        .describe('Optional search query to filter memories by content.'),
      userId: z
        .string()
        .optional()
        .describe('Optional user ID to filter memories for a specific user.'),
    }),
    execute: async ({ projectId, query, userId }) => {
      console.log('🔍 get-mem0-memories: Starting execution');
      console.log('🔍 get-mem0-memories: Input params:', {
        projectId,
        query,
        userId,
      });

      try {
        console.log('🔍 get-mem0-memories: Checking session...');
        console.log(
          '🔍 get-mem0-memories: Session user email:',
          session?.user?.email,
        );
        console.log('🔍 get-mem0-memories: Session role:', session?.role);

        if (!session?.user?.email) {
          console.log('❌ get-mem0-memories: No user email in session');
          throw new ChatSDKError(
            'unauthorized:chat',
            'No user email in session',
          );
        }

        // if (session?.role !== 'org-developer') {
        //   console.log(
        //     '❌ get-mem0-memories: Access denied, role is:',
        //     session?.role,
        //   );
        //   throw new ChatSDKError(
        //     'forbidden:chat',
        //     'Access denied. Developer role required for Mem0 operations.',
        //   );
        // }

        if (!projectId) {
          console.log('❌ get-mem0-memories: No project ID provided');
          throw new ChatSDKError(
            'bad_request:chat',
            'Project ID is required to fetch memories.',
          );
        }

        console.log('✅ get-mem0-memories: All validations passed');
        console.log('🔍 get-mem0-memories: Creating Mem0 client...');

        // Use the Mem0 client directly
        const client = createMem0Client();
        console.log('✅ get-mem0-memories: Client created successfully');
        console.log('🔍 get-mem0-memories: Client orgId:', client.getOrgId());

        let memories: any[];
        if (query) {
          console.log(
            '🔍 get-mem0-memories: Searching project memories with query:',
            query,
          );
          console.log('🔍 get-mem0-memories: Search params:', {
            projectId,
            query,
            user_id: userId,
            limit: 50,
          });

          memories = await client.searchProjectMemories(projectId, {
            query,
            user_id: userId,
            limit: 50,
          });

          console.log('✅ get-mem0-memories: Search completed');
          console.log(
            '🔍 get-mem0-memories: Search results count:',
            Array.isArray(memories) ? memories.length : 'not an array',
          );
          console.log(
            '🔍 get-mem0-memories: Raw search response:',
            JSON.stringify(memories, null, 2),
          );
        } else {
          console.log('🔍 get-mem0-memories: Getting all project memories');
          console.log('🔍 get-mem0-memories: Get params:', {
            projectId,
            userId,
          });

          memories = await client.getProjectMemories(projectId, userId);

          console.log('✅ get-mem0-memories: Get all completed');
          console.log(
            '🔍 get-mem0-memories: Get all results count:',
            Array.isArray(memories) ? memories.length : 'not an array',
          );
          console.log(
            '🔍 get-mem0-memories: Raw get all response:',
            JSON.stringify(memories, null, 2),
          );
        }

        console.log('🔍 get-mem0-memories: Processing results for return...');

        // Filter memories to only include essential fields
        const filteredMemories = Array.isArray(memories)
          ? memories.map((memory) => ({
              memory: memory.memory,
              created_at: memory.created_at,
            }))
          : [];

        console.log(
          '🔍 get-mem0-memories: Final filtered memories:',
          JSON.stringify(filteredMemories, null, 2),
        );

        const disclaimer =
          'Below are the memories retrieved from the specified Mem0 project. Note that this contains user data, so treat it appropriately.';
        const boundaryId = `mem0-memories-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const wrappedResult = `${disclaimer}\n\n<${boundaryId}>\n${JSON.stringify(filteredMemories, null, 2)}\n</${boundaryId}>\n\nUse this memory data to understand user context and inform your responses appropriately.`;

        console.log('✅ get-mem0-memories: Successfully returning result');
        console.log(
          '🔍 get-mem0-memories: Wrapped result length:',
          wrappedResult.length,
        );

        return {
          result: wrappedResult,
        };
      } catch (error) {
        console.log('❌ get-mem0-memories: Error occurred:', error);
        console.log('🔍 get-mem0-memories: Error type:', typeof error);
        console.log(
          '🔍 get-mem0-memories: Error constructor:',
          error?.constructor?.name,
        );

        if (error instanceof ChatSDKError) {
          console.log(
            '❌ get-mem0-memories: Throwing ChatSDKError:',
            error.message,
          );
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        console.log(
          '🔍 get-mem0-memories: Processing error message:',
          errorMessage,
        );
        console.log(
          '🔍 get-mem0-memories: Full error object:',
          JSON.stringify(error, Object.getOwnPropertyNames(error)),
        );

        if (
          errorMessage.includes('MEM0_API_KEY') ||
          errorMessage.includes('MEM0_ORG_ID')
        ) {
          console.log('❌ get-mem0-memories: API credentials error detected');
          throw new ChatSDKError(
            'bad_request:chat',
            'Mem0 API credentials not configured. Please check your environment variables.',
          );
        }

        console.log(
          '❌ get-mem0-memories: Throwing generic error with message:',
          errorMessage,
        );
        throw new ChatSDKError(
          'bad_request:chat',
          `Failed to fetch Mem0 memories: ${errorMessage}`,
        );
      }
    },
  });
