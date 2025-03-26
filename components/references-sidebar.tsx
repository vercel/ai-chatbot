'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from './markdown';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, FileTextIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useReferencesSidebar, useReferencesSidebarSelector } from '@/hooks/use-references-sidebar';
import { ScrollArea } from './ui/scroll-area';

export function ReferencesSidebar({ chatId, messageId }: { chatId: string; messageId?: string }) {
  const isVisible = useReferencesSidebarSelector((state) => state.isVisible);
  const references = useReferencesSidebarSelector((state) => state.references);
  const activeReferenceId = useReferencesSidebarSelector((state) => state.activeReferenceId);
  const isCollapsed = useReferencesSidebarSelector((state) => state.isCollapsed);
  const currentMessageId = useReferencesSidebarSelector((state) => state.messageId);
  const { toggleSidebar, setActiveReference, toggleCollapse } = useReferencesSidebar();
  
  // Only show if we have references and the messageId matches
  useEffect(() => {
    if (references.length > 0 && !isVisible && (!messageId || messageId === currentMessageId)) {
      console.log('Auto-showing references sidebar for message:', currentMessageId);
      toggleSidebar();
    }
  }, [references.length, isVisible, toggleSidebar, messageId, currentMessageId]);
  
  const activeRefElementRef = useRef<HTMLDivElement>(null);

  // Scroll to active reference when it changes
  useEffect(() => {
    if (activeReferenceId && activeRefElementRef.current) {
      activeRefElementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeReferenceId]);

  // Don't show if the sidebar is not visible, has no references, or the messageId doesn't match
  if (!isVisible || references.length === 0 || (messageId && messageId !== currentMessageId)) {
    return null;
  }

  return (
    <div className={cn(
      "fixed right-0 top-[57px] h-[calc(100vh-57px)] bg-background border-l border-border shadow-lg z-30 flex flex-col transition-all duration-300",
      isCollapsed ? "w-12" : "w-80 sm:w-64 md:w-72 lg:w-80"
    )}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && <h3 className="text-sm font-medium">References</h3>}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand references panel" : "Collapse references panel"}
          >
            {isCollapsed ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
          </Button>
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={toggleSidebar}
              aria-label="Close references panel"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className={cn("flex-1", isCollapsed ? "p-1" : "p-3")}>
        <div className="flex flex-col gap-3">
          {references.map((reference, index) => {
            const isActive = reference.id === activeReferenceId;
            
            return (
              <div
                key={reference.id}
                ref={isActive ? activeRefElementRef : null}
                className={cn(
                  "border rounded-lg overflow-hidden transition-colors",
                  isActive 
                    ? "border-primary bg-secondary/20" 
                    : "border-border hover:border-secondary/50"
                )}
              >
                <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer">
                  <div className="flex items-center gap-2" onClick={() => setActiveReference(isActive ? null : reference.id)}>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    {!isCollapsed && <span className="font-medium truncate">{reference.title}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {reference.url && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(reference.url, '_blank');
                            }}
                          >
                            <ExternalLinkIcon size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open source</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <div className={cn(
                  "p-3 bg-background transition-all overflow-hidden",
                  isActive ? "max-h-96" : "max-h-0 p-0",
                  isCollapsed ? "hidden" : ""
                )}>
                  {isActive && !isCollapsed && (
                    <ScrollArea className="max-h-80 pr-2">
                      <Markdown>{reference.content}</Markdown>
                      <div className="text-xs text-muted-foreground mt-2">
                        Relevance: {Math.round(reference.score * 100)}%
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Button to toggle the references sidebar
export function ReferencesSidebarToggle() {
  const isVisible = useReferencesSidebarSelector((state) => state.isVisible);
  const references = useReferencesSidebarSelector((state) => state.references);
  const { toggleSidebar } = useReferencesSidebar();

  if (references.length === 0) {
    return null;
  }

  return (
    <Button
      variant={isVisible ? "default" : "outline"}
      size="sm"
      className="gap-1.5"
      onClick={toggleSidebar}
    >
      <FileTextIcon size={16} />
      <span>References</span>
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs">
        {references.length}
      </span>
    </Button>
  );
}
