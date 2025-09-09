import { PhaseGuard } from '@/apps/web/lib/journey/guard';
import { usePhase, useJourneyActions } from '@/apps/web/lib/journey/hooks';
import type { Phase } from '@/apps/web/lib/journey/map';
import { blueprint } from '@/apps/web/lib/journey/blueprint';

export default async function Page({ params }: { params: Promise<{ phase: Phase }> }) {
  const { phase } = await params;

  return (
    <PhaseGuard phase={phase}>
      <PhaseView />
    </PhaseGuard>
  );
}

function PhaseView() {
  'use client';
  const phase = usePhase();
  const { next, prev, skip, reset } = useJourneyActions();
  const nodes = blueprint[phase] ?? [];

  return (
    <div>
      <h1>{phase}</h1>
      {nodes.length > 0 && (
        <ul>
          {nodes.map((n) => (
            <li key={n.id}>
              <strong>{n.type === 'input' ? 'Input' : 'Output'}:</strong> {n.label} - {n.description}
            </li>
          ))}
        </ul>
      )}
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
