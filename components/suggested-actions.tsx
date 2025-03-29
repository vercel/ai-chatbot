'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface SuggestedAction {
  id: string;
  text: string;
  content: string;
}

export interface SuggestedActionsProps {
  suggestions: SuggestedAction[];
  onAction: (content: string) => void;
}

export function SuggestedActions({ suggestions, onAction }: SuggestedActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-4">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent 
            className="p-3 flex items-center"
            onClick={() => onAction(suggestion.content)}
          >
            <span className="text-sm">{suggestion.text}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
