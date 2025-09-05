'use client';
import { PhaseGuard } from '@/apps/web/lib/journey/guard';
import { usePhase, useJourneyActions } from '@/apps/web/lib/journey/hooks';
import type { Phase } from '@/apps/web/lib/journey/map';

export default function Page({ params }: { params: { phase: Phase } }) {
  return (
    <PhaseGuard phase={params.phase}>
      <PhaseView />
    </PhaseGuard>
  );
}

function PhaseView() {
  const phase = usePhase();
  const { next, prev, skip, reset } = useJourneyActions();
  return (
    <div>
      <h1>{phase}</h1>
      <button id="prev" onClick={prev}>
        Prev
      </button>
      <button id="next" onClick={next}>
        Next
      </button>
      <button id="skip" onClick={() => skip('Recommendation')}>
        Skip
      </button>
      <button id="reset" onClick={reset}>
        Reset
      </button>
    </div>
  );
}
