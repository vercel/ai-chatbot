import { PhaseGuard } from '@/apps/web/lib/journey/guard';
import { usePhase, useJourneyActions } from '@/apps/web/lib/journey/hooks';
import type { Phase } from '@/apps/web/lib/journey/map';
import { blueprint } from '@/apps/web/lib/journey/blueprint';
import SolarPanelComponent, { type ISolarPanel } from '@/lib/autoview/solar-panel-component';

export default async function Page({ params }: Readonly<{ params: Promise<{ phase: Phase }> }>) {
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

  // Sample solar panel data for demonstration
  const samplePanel: ISolarPanel = {
    id: "panel-001",
    model: "SolarMax Pro 400W",
    manufacturer: "SolarTech",
    wattage: 400,
    efficiency: 0.22,
    price: 250
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{phase}</h1>

      {nodes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Journey Steps</h2>
          <ul className="space-y-2">
            {nodes.map((n) => (
              <li key={n.id} className="flex items-start space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  n.type === 'input' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {n.type === 'input' ? 'Input' : 'Output'}
                </span>
                <div>
                  <strong className="text-gray-900">{n.label}:</strong>
                  <span className="text-gray-600 ml-1">{n.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Solar Panel Component for Dimensioning Phase */}
      {phase === 'Dimensioning' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recommended Solar Panel</h2>
          <SolarPanelComponent panel={samplePanel} />
        </div>
      )}

      <div className="flex space-x-4">
        <button
          id="prev"
          onClick={prev}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Previous
        </button>
        <button
          id="next"
          onClick={next}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Next
        </button>
        <button
          id="skip"
          onClick={() => skip('Recommendation')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Skip to Recommendation
        </button>
        <button
          id="reset"
          onClick={reset}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
