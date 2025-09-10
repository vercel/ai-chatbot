import { PhaseGuard } from "@/apps/web/lib/journey/guard";
import { usePhase, useJourneyActions } from "@/apps/web/lib/journey/hooks";
import type { Phase } from "@/apps/web/lib/journey/map";
import { blueprint } from "@/apps/web/lib/journey/blueprint";
import SolarPanelComponent, {
  type ISolarPanel,
} from "@/lib/autoview/solar-panel-component";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { Button } from "@/components/ui/button";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ phase: Phase }> }>) {
  const { phase } = await params;

  return (
    <PhaseGuard phase={phase}>
      <PhaseView />
    </PhaseGuard>
  );
}

function PhaseView() {
  "use client";
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
    price: 250,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Jornada", href: "/journey" },
          { label: phase },
        ]}
      />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{phase}</h1>

      {nodes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Journey Steps
          </h2>
          <ul className="space-y-2">
            {nodes.map((n) => (
              <li key={n.id} className="flex items-start space-x-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    n.type === "input"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {n.type === "input" ? "Input" : "Output"}
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
      {phase === "Dimensioning" && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Recommended Solar Panel
          </h2>
          <SolarPanelComponent panel={samplePanel} />
        </div>
      )}

      <NextCTA
        primary={{ label: "Next", onClick: next }}
        secondary={{ label: "Previous", onClick: prev }}
      />
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          id="skip"
          onClick={() => skip("Recommendation")}
        >
          Skip to Recommendation
        </Button>
        <Button variant="outline" id="reset" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
