import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

export interface Transcript {
  id: number;
  recording_start: string;
  summary: string;
  projects: string[];
  clients: string[];
  meeting_type: 'internal' | 'external' | 'unknown';
  extracted_participants: string[];
  verified_participant_emails?: string[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function useTranscripts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  const cacheKey = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    return `/api/transcripts?${params}`;
  }, [pagination.page, pagination.limit]);

  const { data, error, isLoading } = useSWR(cacheKey, fetcher);

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  const filteredTranscripts = useMemo(
    () => {
      const transcripts: Transcript[] = data?.data || [];
      return transcripts.filter(
        (transcript) =>
          transcript.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transcript.extracted_participants.some((participant) =>
            participant.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    },
    [data?.data, searchTerm],
  );

  const groupedTranscripts = useMemo(() => {
    const groups: { [key: string]: Transcript[] } = {};
    filteredTranscripts.forEach((transcript) => {
      const date = new Date(transcript.recording_start);
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transcript);
    });
    return groups;
  }, [filteredTranscripts]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return {
    searchTerm,
    setSearchTerm,
    pagination,
    handlePageChange,
    groupedTranscripts,
    filteredTranscripts,
    isLoading,
    error,
  };
}
