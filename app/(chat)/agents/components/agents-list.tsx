'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
// router not needed for quick view sheet navigation
import { AgentQuickView } from './agent-quick-view';
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
import { AgentsHeader } from './agents-header';
import { AgentCard } from './agent-card';
import type { Agent } from '@/lib/db/schema';

interface AgentsListProps {
  agents: Agent[];
}

const AGENTS_PER_PAGE = 12;

export function AgentsList({ agents }: AgentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filteredAgents = useMemo(() => {
    if (!searchTerm) return agents;
    
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
    return filteredAgents.slice(startIndex, startIndex + AGENTS_PER_PAGE);
  }, [filteredAgents, currentPage]);

  const totalPages = Math.ceil(filteredAgents.length / AGENTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setQuickViewOpen(true);
  };

  if (!agents.length) {
    return (
      <div className="space-y-6">
        <AgentsHeader
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchChange}
          totalAgents={0}
        />
        <div className="text-center py-12">
          <div className="p-4 bg-muted/20 rounded-lg inline-block mb-4">
            <svg
              className="size-8 text-muted-foreground mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No agents available</h3>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first AI agent.
          </p>
          <Button asChild>
            <Link href="/agents/new">Create Agent</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgentsHeader
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchChange}
        totalAgents={filteredAgents.length}
      />

      {filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No agents found matching your search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={false}
                isSelectionMode={false}
                onSelect={handleSelectAgent}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>
                  {currentPage > 3 && (
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
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
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
                            isActive={i === currentPage}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>,
                      );
                    }
                    return pages;
                  })()}
                  {currentPage < totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <AgentQuickView
        agent={selectedAgent}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
}