'use client';

import { ZoomIcon } from './icons';

interface TranscriptToolProps {
  toolCallId: string;
  state: 'input-available' | 'output-available';
  output?: any;
  input?: any;
  isReadonly?: boolean;
}

function formatSearchParameters(input: any, toolType: string): string {
  if (!input) return '';

  switch (toolType) {
    case 'tool-searchTranscriptsByKeyword': {
      const keywordParams = [];
      if (input.keyword) keywordParams.push(`keyword: "${input.keyword}"`);
      if (input.limit) keywordParams.push(`limit: ${input.limit}`);
      if (input.scope && input.scope !== 'summary')
        keywordParams.push(`scope: ${input.scope}`);
      if (input.fuzzy) keywordParams.push('fuzzy search');
      if (input.start_date) keywordParams.push(`from: ${input.start_date}`);
      if (input.end_date) keywordParams.push(`to: ${input.end_date}`);
      if (input.meeting_type) keywordParams.push(`type: ${input.meeting_type}`);
      return keywordParams.length > 0 ? `(${keywordParams.join(', ')})` : '';
    }

    case 'tool-searchTranscriptsByUser': {
      const userParams = [];
      if (input.participant_name)
        userParams.push(`participant: "${input.participant_name}"`);
      if (input.host_email) userParams.push(`host: "${input.host_email}"`);
      if (input.verified_participant_email)
        userParams.push(`verified: "${input.verified_participant_email}"`);
      if (input.limit) userParams.push(`limit: ${input.limit}`);
      if (input.start_date) userParams.push(`from: ${input.start_date}`);
      if (input.end_date) userParams.push(`to: ${input.end_date}`);
      if (input.meeting_type) userParams.push(`type: ${input.meeting_type}`);
      return userParams.length > 0 ? `(${userParams.join(', ')})` : '';
    }

    case 'tool-getTranscriptDetails':
      if (input.transcript_ids && input.transcript_ids.length > 0) {
        const ids = input.transcript_ids.join(', ');
        return `(IDs: ${ids})`;
      }
      return '';

    default:
      return '';
  }
}

function getResultCount(output: any): number {
  if (!output || 'error' in output) return 0;

  try {
    // The result is a string with security boundaries, we need to extract the JSON array
    if (typeof output.result === 'string') {
      // Look for the JSON array between the boundary tags
      const match = output.result.match(/<[^>]+>\s*(\[.*?\])\s*<\/[^>]+>/s);
      if (match) {
        const jsonArray = JSON.parse(match[1]);
        return Array.isArray(jsonArray) ? jsonArray.length : 0;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

export function TranscriptTool({
  toolCallId,
  state,
  output,
  input,
  isReadonly = false,
}: TranscriptToolProps) {
  // Determine tool type from toolCallId or input structure
  const toolType = toolCallId.includes('searchTranscriptsByKeyword')
    ? 'tool-searchTranscriptsByKeyword'
    : toolCallId.includes('searchTranscriptsByUser')
      ? 'tool-searchTranscriptsByUser'
      : toolCallId.includes('getTranscriptDetails')
        ? 'tool-getTranscriptDetails'
        : 'unknown';

  if (state === 'input-available') {
    const params = formatSearchParameters(input, toolType);
    return (
      <div className="pt-1.5 pb-4 border-b border-muted text-sm flex items-center gap-2">
        <ZoomIcon size={16} />
        searching zoom {params}
      </div>
    );
  }

  if (state === 'output-available') {
    if (output && 'error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error: {String(output.error)}
        </div>
      );
    }

    const resultCount = getResultCount(output);
    const params = formatSearchParameters(input, toolType);

    return (
      <div className="pt-1.5 pb-4 border-b border-muted text-sm flex items-center gap-2">
        <ZoomIcon size={16} />
        Search completed {params} ({resultCount} results)
      </div>
    );
  }

  return null;
}
