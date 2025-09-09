'use client';

import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { LoadingText } from '@/components/elements/loading-text';

export function ChainOfThoughtPlaceholder() {
  return (
    <ChainOfThought defaultOpen={true}>
      <ChainOfThoughtHeader>
        <LoadingText>Working</LoadingText>
      </ChainOfThoughtHeader>
      {/* No step body here to avoid duplicate 'Thinking' rows */}
      <ChainOfThoughtContent />
    </ChainOfThought>
  );
}
