import { z } from 'zod';
import type { Session, ChatMessage } from '@/lib/types';
import { tool, type UIMessageStreamWriter } from 'ai';
import { createClient } from '@supabase/supabase-js';

interface SearchTranscriptsByUserProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const searchTranscriptsByUser = ({
  session,
  dataStream,
}: SearchTranscriptsByUserProps) =>
  tool({
    description:
      'Searches meeting transcripts by participant name, host email, or verified participant email, with optional filters for date range and meeting type. Do not guess an email - make sure you clarify with the user what the email is unless obvious. ',
    inputSchema: z.object({
      participant_name: z
        .string()
        .optional()
        .describe('The name of a participant to search for.'),
      host_email: z
        .string()
        .optional()
        .describe('The email of the meeting host.'),
      verified_participant_email: z
        .string()
        .optional()
        .describe('The email of a verified participant.'),
      start_date: z
        .string()
        .optional()
        .describe('The start date of the meeting in YYYY-MM-DD'),
      end_date: z
        .string()
        .optional()
        .describe('The end date of the meeting in YYYY-MM-DD'),
      meeting_type: z
        .enum(['internal', 'external', 'unknown'])
        .optional()
        .describe('The type of meeting.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe('The number of transcripts to return.'),
    }),
    execute: async ({
      participant_name,
      host_email,
      verified_participant_email,
      start_date,
      end_date,
      meeting_type,
      limit,
    }) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          error:
            'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.',
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const lim = Number(limit);

      let query = supabase
        .from('transcripts')
        .select(
          'id, recording_start, summary, projects, clients, meeting_type, extracted_participants, host_email, verified_participant_emails',
        )
        .order('recording_start', { ascending: false })
        .limit(lim);

      if (start_date) query = query.gte('recording_start', start_date);
      if (end_date) query = query.lte('recording_start', end_date);
      if (meeting_type) query = query.eq('meeting_type', meeting_type);
      if (participant_name)
        query = query.contains('extracted_participants', [participant_name]);
      if (host_email) query = query.eq('host_email', host_email);
      if (verified_participant_email)
        query = query.contains('verified_participant_emails', [
          verified_participant_email,
        ]);

      // RBAC: If user role is 'member', only return transcripts where they are a verified participant
      if (session.role === 'member' && session.user.email) {
        query = query.contains('verified_participant_emails', [
          session.user.email,
        ]);
      }

      const { data, error } = await query;

      if (error) {
        return {
          error: `Database error: ${error.message}`,
        };
      }

      // Provide helpful message if member has no results due to permissions
      if (session.role === 'member' && (!data || data.length === 0)) {
        return {
          result: JSON.stringify([]),
          message:
            'No transcripts found matching your search. Note: As a member, you can only search transcripts where you are a verified participant.',
        };
      }

      return {
        result: JSON.stringify(data ?? []),
      };
    },
  });
