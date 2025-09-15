"use client";

import { useCallback, useEffect, useState } from "react";
import { RoofUpload } from "@/components/detection/RoofUpload";
import { DetectionReport } from "@/components/detection/DetectionReport";
import { analyzeRoofAction } from "@/app/actions/analyzeRoofAction";
import type { DetectionResult } from "@/lib/detection/types";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { usePersona } from "@/lib/persona/context";
import { useJourneyActions, usePhase } from "@/apps/web/lib/journey/hooks";
import { trackEvent } from "@/lib/analytics/events";
import { getPhaseRoute } from "@/apps/web/lib/journey/map";

type AnalyzeFile = {
  name: string;
  type: string;
  size: number;
  blobUrl: string;
};

export default function DetectionPage() {
  const { mode } = usePersona();
  const journeyPhase = usePhase();
  const { skip } = useJourneyActions();
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (journeyPhase !== "Detection") {
      skip("Detection");
    }
  }, [journeyPhase, skip]);

  useEffect(() => {
    trackEvent("journey_phase_view", {
      persona: mode,
      phase: "Detection",
      route: getPhaseRoute("Detection"),
      ts: new Date().toISOString(),
    });
  }, [mode]);

  const handleAnalyze = useCallback(
    async (files: AnalyzeFile[]) => {
      setStatus("loading");
      setError(null);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("persona", mode);
        for (const file of files) {
          const res = await fetch(file.blobUrl);
          const blob = await res.blob();
          const fileObj = new File([blob], file.name, { type: file.type });
          formData.append("files", fileObj);
        }

        const response = await analyzeRoofAction(formData);
        if (response.success && response.data) {
          setResult(response.data);
          setStatus("idle");
        } else {
          setError(response.error || "Erro na análise");
          setStatus("error");
        }
      } catch (err) {
        console.error("Erro ao processar análise:", err);
        setError("Erro ao processar análise");
        setStatus("error");
      }
    },
    [mode],
  );

  const handleProceed = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Detection",
      ctaLabel: "Ir para Análise",
      to: getPhaseRoute("Analysis"),
    });
    skip("Analysis");
  }, [mode, skip]);

  const handleRetry = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Detection",
      ctaLabel: "Reenviar imagens",
      to: getPhaseRoute("Detection"),
    });
    setResult(null);
    setStatus("idle");
  }, [mode]);

  const handleExport = useCallback(() => {
    // Implementar export CSV real
    alert("Exportar CSV - funcionalidade a implementar");
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Jornada", href: "/journey" },
          { label: "Detecção" },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Detecção do Telhado</h1>
        <p className="text-muted-foreground text-sm">
          Envie imagens do telhado para identificar oportunidades de instalação.
        </p>
      </header>

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState retry={handleRetry} />}

      {!result && (
        <RoofUpload
          persona={mode}
          onAnalyze={handleAnalyze}
          isAnalyzing={status === "loading"}
        />
      )}

      {error && status !== "error" && (
        <div
          className="mt-4 p-3 bg-red-100 text-red-700 rounded"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <DetectionReport
            result={result}
            persona={mode}
            onExport={handleExport}
          />
          <NextCTA
            primary={{ label: "Ir para Análise", onClick: handleProceed }}
            secondary={{ label: "Reenviar imagens", onClick: handleRetry }}
          />
        </div>
      )}

      <a href="/chat?open=help" className="text-sm underline">
        Precisa de ajuda?
      </a>
    </div>
  );
}
