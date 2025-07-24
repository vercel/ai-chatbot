'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TranscriptSheet } from '@/app/(chat)/transcripts/components/transcript-sheet';
import { CalendarIcon } from 'lucide-react';
import { useTranscripts, type Transcript } from './list/use-transcripts';
import { TranscriptHeader } from './list/transcript-header';
import { TranscriptCard } from './list/transcript-card';
import { TranscriptChatInput } from './list/transcript-chat-input';

export function TranscriptsList() {
  const {
    searchTerm,
    setSearchTerm,
    pagination,
    handlePageChange,
    groupedTranscripts,
    filteredTranscripts,
    isLoading,
    error,
  } = useTranscripts();

  const [selectedTranscript, setSelectedTranscript] =
    useState<Transcript | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTranscripts, setSelectedTranscripts] = useState<Set<number>>(
    new Set(),
  );

  const handleSelectTranscript = (transcript: Transcript) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedTranscripts);
      if (newSelected.has(transcript.id)) {
        newSelected.delete(transcript.id);
      } else {
        newSelected.add(transcript.id);
      }
      setSelectedTranscripts(newSelected);
    } else {
      setSelectedTranscript(transcript);
      setIsModalOpen(true);
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTranscripts(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full size-6 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading transcripts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error: {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const selectedTranscriptData = filteredTranscripts.filter((t) =>
    selectedTranscripts.has(t.id),
  );

  return (
    <div
      className={`space-y-6 ${
        isSelectionMode && selectedTranscripts.size > 0 ? 'pb-24' : ''
      }`}
    >
      <TranscriptHeader
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        totalTranscripts={pagination.total}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        selectedCount={selectedTranscripts.size}
      />

      <div className="space-y-8">
        {Object.entries(groupedTranscripts).map(([dateKey, transcripts]) => (
          <div key={dateKey} className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                {dateKey}
              </h3>
            </div>
            <div className="space-y-3">
              {transcripts.map((transcript) => (
                <TranscriptCard
                  key={transcript.id}
                  transcript={transcript}
                  isSelected={selectedTranscripts.has(transcript.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={handleSelectTranscript}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTranscripts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm
              ? 'No transcripts found matching your search.'
              : 'No transcripts available.'}
          </p>
        </div>
      )}

      {isSelectionMode && selectedTranscripts.size > 0 && (
        <TranscriptChatInput selectedTranscripts={selectedTranscriptData} />
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.hasPrev) {
                      handlePageChange(pagination.page - 1);
                    }
                  }}
                  className={
                    !pagination.hasPrev ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
              {pagination.page > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                </>
              )}
              {(() => {
                const startPage = Math.max(1, pagination.page - 2);
                const endPage = Math.min(
                  pagination.totalPages,
                  pagination.page + 2,
                );
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(i);
                        }}
                        isActive={i === pagination.page}
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>,
                  );
                }
                return pages;
              })()}
              {pagination.page < pagination.totalPages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pagination.totalPages);
                      }}
                    >
                      {pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.hasNext) {
                      handlePageChange(pagination.page + 1);
                    }
                  }}
                  className={
                    !pagination.hasNext ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <TranscriptSheet
        transcript={selectedTranscript}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
