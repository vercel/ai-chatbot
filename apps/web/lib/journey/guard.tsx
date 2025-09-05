'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { journeyMap, phases, type Phase } from './map';
import { useJourneyActions } from './hooks';

export function PhaseGuard({
  phase,
  children,
}: {
  phase: Phase;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { skip } = useJourneyActions();

  useEffect(() => {
    if (!journeyMap[phase]) {
      router.replace(`/journey/${phases[0]}`);
      return;
    }
    skip(phase);
  }, [phase, skip, router]);

  return <>{children}</>;
}
