'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClockIcon } from 'lucide-react';
import type { Transcript } from './use-transcripts';

interface TranscriptCardProps {
  transcript: Transcript;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (transcript: Transcript) => void;
}

const extractTopic = (summary: string) => {
  if (!summary) return 'No summary available';
  const topicMatch = summary.match(/Topic:\s*([^\n]*)/i);
  if (topicMatch?.[1]) {
    const topic = topicMatch[1].trim();
    if (topic.length > 80) {
      return `${topic.substring(0, 77)}...`;
    }
    return topic;
  }
  const firstLine = summary.split('\n')[0].trim();
  if (firstLine.length > 80) {
    return `${firstLine.substring(0, 77)}...`;
  }
  return firstLine || 'No summary available';
};

export function TranscriptCard({
  transcript,
  isSelected,
  isSelectionMode,
  onSelect,
}: TranscriptCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-border/80 ${
        isSelected ? 'ring-2 ring-green-500 bg-green-50 border-green-200' : ''
      } ${isSelectionMode ? ' bg-blue-50/30 shadow-md' : ''}`}
      onClick={() => onSelect(transcript)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1 mb-2">
              {extractTopic(transcript.summary)}
            </h4>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ClockIcon className="size-4 text-muted-foreground" />
                <span>
                  {new Date(transcript.recording_start).toLocaleTimeString(
                    'en-US',
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    },
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <circle cx="6" cy="4" r="2" />
                  <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                </svg>
                <span>
                  {transcript.extracted_participants.length} participants
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full ${
                  transcript.meeting_type === 'internal'
                    ? 'bg-blue-100 text-blue-700'
                    : transcript.meeting_type === 'external'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {transcript.meeting_type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
            <span className="max-w-[200px] truncate">
              {transcript.extracted_participants.slice(0, 5).join(', ')}
              {transcript.extracted_participants.length > 2 &&
                ` +${transcript.extracted_participants.length - 2}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
