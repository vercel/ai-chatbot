'use client';
import { useContext } from 'react';
import { JourneyContext } from './context';
import type { Phase } from './map';

export function usePhase(): Phase {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('usePhase must be used within JourneyProvider');
  return ctx.phase;
}

export function useJourneyActions() {
  const ctx = useContext(JourneyContext);
  if (!ctx)
    throw new Error('useJourneyActions must be used within JourneyProvider');
  const { next, prev, skip, reset } = ctx;
  return { next, prev, skip, reset };
}
