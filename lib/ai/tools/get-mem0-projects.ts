import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod/v4';
import type { ChatMessage, Session } from '@/lib/types';
import { ChatSDKError } from '@/lib/errors';
import { createMem0Client } from '@/lib/mem0/client';

interface GetMem0ProjectsProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const getMem0Projects = ({
  session,
  dataStream,
}: GetMem0ProjectsProps) =>
  tool({
    description: 'Retrieves all available Mem0 projects for the organization.',
    inputSchema: z.object({}),
    execute: async () => {
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

        // Use the Mem0 client directly
        const client = createMem0Client();
        const projects = await client.getProjects();

        const result = {
          projects: projects,
          total: Array.isArray(projects) ? projects.length : 0,
        };

        const disclaimer =
          'Below are the available Mem0 projects. Use this data to inform your next steps or to create memories within specific projects.';
        const boundaryId = `mem0-projects-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const wrappedResult = `${disclaimer}\n\n<${boundaryId}>\n${JSON.stringify(result, null, 2)}\n</${boundaryId}>\n\nUse this project information to create or retrieve memories within the appropriate project context.`;

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

        throw new ChatSDKError(
          'bad_request:chat',
          `Failed to fetch Mem0 projects: ${errorMessage}`,
        );
      }
    },
  });
