"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressiveLeadForm from "@/components/intent/ProgressiveLeadForm";
import LeadValidationCard from "@/components/lead/LeadValidationCard";
import type { LeadValidationResult } from "@/lib/lead/types";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { usePersona } from "@/lib/persona/context";
import { useJourneyActions, usePhase } from "@/apps/web/lib/journey/hooks";
import { getPhaseRoute } from "@/apps/web/lib/journey/map";
import { trackEvent } from "@/lib/analytics/events";

export default function InvestigationPage() {
  const router = useRouter();
  const { mode } = usePersona();
  const journeyPhase = usePhase();
  const { skip } = useJourneyActions();
  const [validationResult, setValidationResult] =
    useState<LeadValidationResult | null>(null);

  useEffect(() => {
    if (journeyPhase !== "Investigation") {
      skip("Investigation");
    }
  }, [journeyPhase, skip]);

  useEffect(() => {
    trackEvent("journey_phase_view", {
      persona: mode,
      phase: "Investigation",
      route: getPhaseRoute("Investigation"),
      ts: new Date().toISOString(),
    });
  }, [mode]);

  const handleIntentValidated = (result: LeadValidationResult) => {
    setValidationResult(result);
  };

  const handleProceed = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Investigation",
      ctaLabel: "Ir para Detecção",
      to: getPhaseRoute("Detection"),
    });
    skip("Detection");
  }, [mode, skip]);

  const handleBackToStart = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Investigation",
      ctaLabel: "Voltar para início",
      to: "/",
    });
    router.push("/");
  }, [mode, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Jornada", href: "/journey" },
              { label: "Investigação" },
            ]}
          />

          <header className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Investigação Inicial
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Vamos começar entendendo suas necessidades e validando suas
              informações
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <ProgressiveLeadForm onValidated={handleIntentValidated} />
            </div>

            <div>
              {validationResult && (
                <LeadValidationCard result={validationResult} />
              )}
            </div>
          </div>

          <NextCTA
            primary={{ label: "Ir para Detecção", onClick: handleProceed }}
            secondary={{ label: "Voltar para início", onClick: handleBackToStart }}
          />

          <a href="/chat?open=help" className="text-sm underline">
            Precisa de ajuda?
          </a>
        </div>
      </div>
    </div>
  );
}
