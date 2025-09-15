"use client";

import { useCallback, useEffect, useState } from "react";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { SiteInput } from "../../../components/dimensioning/SiteInput";
import { DimensioningSpec } from "../../../components/dimensioning/DimensioningSpec";
import type { DimensioningResult } from "@/lib/dimensioning/types";
import { usePersona } from "@/lib/persona/context";
import { useJourneyActions, usePhase } from "@/apps/web/lib/journey/hooks";
import { trackEvent } from "@/lib/analytics/events";
import { getPhaseRoute } from "@/apps/web/lib/journey/map";

export default function DimensioningPage() {
  const { mode } = usePersona();
  const journeyPhase = usePhase();
  const { skip } = useJourneyActions();
  const [result, setResult] = useState<DimensioningResult | null>(null);

  useEffect(() => {
    if (journeyPhase !== "Dimensioning") {
      skip("Dimensioning");
    }
  }, [journeyPhase, skip]);

  useEffect(() => {
    trackEvent("journey_phase_view", {
      persona: mode,
      phase: "Dimensioning",
      route: getPhaseRoute("Dimensioning"),
      ts: new Date().toISOString(),
    });
  }, [mode]);

  const handleCalculated = useCallback((calcResult: DimensioningResult) => {
    setResult(calcResult);
  }, []);

  const handleProceed = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Dimensioning",
      ctaLabel: "Ir para Simulação",
      to: getPhaseRoute("Simulation"),
    });
    skip("Simulation");
  }, [mode, skip]);

  const handleAdjust = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Dimensioning",
      ctaLabel: "Ajustar dimensionamento",
      to: getPhaseRoute("Dimensioning"),
    });
    setResult(null);
  }, [mode]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Jornada", href: "/journey" },
          { label: "Dimensionamento" },
        ]}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold yello-gradient-text">
            Dimensionamento do Sistema FV
          </h1>
          <p className="text-muted-foreground">
            Ajuste parâmetros técnicos para obter a configuração ideal do sistema fotovoltaico.
          </p>
        </header>

        <SiteInput
          persona={mode}
          onCalculated={handleCalculated}
          submitMode="serverAction"
          layout="wide"
          className="glass yello-stroke p-6"
        />

        {result && (
          <div className="space-y-4">
            <DimensioningSpec
              result={result}
              className="glass yello-stroke p-6"
            />

            <NextCTA
              primary={{ label: "Ir para Simulação", onClick: handleProceed }}
              secondary={{ label: "Ajustar dimensionamento", onClick: handleAdjust }}
            />
          </div>
        )}

        <a href="/chat?open=help" className="text-sm underline">
          Precisa de ajuda?
        </a>
      </div>
    </div>
  );
}
