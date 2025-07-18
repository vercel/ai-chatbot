import { z } from 'zod';
import { tool, type UIMessageStreamWriter } from 'ai';
import { createClient } from '@supabase/supabase-js';
import type { Session, ChatMessage } from '@/lib/types';

interface GetTranscriptDetailsProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const getTranscriptDetails = ({
  session,
  dataStream,
}: GetTranscriptDetailsProps) =>
  tool({
    description:
      'Retrieves the cleaned content of one or more transcripts by their IDs.',
    inputSchema: z.object({
      transcript_ids: z
        .array(z.number().int())
        .min(1, 'At least one transcript ID is required.')
        .max(10, 'Cannot fetch more than 10 transcripts at a time.')
        .describe(
          'An array of transcript IDs (up to 10) to retrieve content for.',
        ),
    }),
    execute: async ({ transcript_ids }) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          error:
            'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.',
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('session', session);
      console.log('session.role', session.role);
      console.log('session.user.email', session.user.email);


      let query = supabase
        .from('transcripts')
        .select('id, transcript_content')
        .in('id', transcript_ids);

      // RBAC: If user role is 'member', only return transcripts where they are a verified participant
      if (session.role === 'member' && session.user.email) {
        query = query.contains('verified_participant_emails', [
          session.user.email,
        ]);
      }

      const { data: foundTranscripts, error } = await query;


      if (error) {
        return {
          error: `Database error: ${error.message}`,
        };
      }

      const results: Array<{
        id: number;
        cleaned_content: string | null;
        message: string | null;
      }> = [];
      const foundMap = new Map(
        (foundTranscripts || []).map((t) => [t.id, t.transcript_content]),
      );


      // Track which transcripts user doesn't have access to (for members only)
      let accessDeniedIds: number[] = [];
      if (
        session.role === 'member' &&
        foundTranscripts.length < transcript_ids.length
      ) {
        const foundIds = new Set(foundTranscripts.map((t) => t.id));
        accessDeniedIds = transcript_ids.filter((id) => !foundIds.has(id));
      }

      for (const reqId of transcript_ids) {
        if (foundMap.has(reqId)) {
          const transcriptContent = foundMap.get(reqId) as any;
          const cleanedContent = transcriptContent?.cleaned;
          if (cleanedContent !== null && cleanedContent !== undefined) {
            results.push({
              id: reqId,
              cleaned_content: String(cleanedContent),
              message: null,
            });
          } else {
            results.push({
              id: reqId,
              cleaned_content: null,
              message: 'No cleaned content available for this transcript.',
            });
          }
        } else {
          results.push({
            id: reqId,
            cleaned_content: null,
            message: 'Transcript ID not found.',
          });
        }
      }

      // Add access denied entries for transcripts user can't access
      for (const deniedId of accessDeniedIds) {
        results.push({
          id: deniedId,
          cleaned_content: null,
          message:
            "Access denied: You don't have permission to view this transcript. Members can only access transcripts where they are verified participants.",
        });
      }

      const response: any = {
        result: JSON.stringify(results),
      };

      // Add warning message if some transcripts were denied
      if (accessDeniedIds.length > 0) {
        response.warning = `Access denied for transcript(s) ${accessDeniedIds.join(', ')}: Members can only access transcripts where they are verified participants.`;
      }

      return response;
    },
  });
