"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Calculator, Download, Share2, Phone } from "lucide-react";
import { EnergyInputForm } from "@/components/analysis/EnergyInput";
import { ViabilityReport } from "@/components/analysis/ViabilityReport";
import { analyzeViabilityAction, exportAnalysisResultAction } from "@/app/actions/analyzeViabilityAction";
import type { EnergyInput, ViabilityResult } from "@/lib/analysis/types";
import { usePersona } from "@/lib/persona/context";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { useJourneyActions, usePhase } from "@/apps/web/lib/journey/hooks";
import { getPhaseRoute } from "@/apps/web/lib/journey/map";
import { trackEvent } from "@/lib/analytics/events";

/**
 * Página de demonstração do módulo de análise de viabilidade
 * Integra EnergyInput e ViabilityReport em um fluxo completo
 */
export default function AnalysisPage() {
  const router = useRouter();
  const { mode } = usePersona();
  const journeyPhase = usePhase();
  const { skip } = useJourneyActions();
  const [isPending, startTransition] = useTransition();

  const [currentStep, setCurrentStep] = useState<"input" | "result">("input");
  const [analysisResult, setAnalysisResult] = useState<ViabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (journeyPhase !== "Analysis") {
      skip("Analysis");
    }
  }, [journeyPhase, skip]);

  useEffect(() => {
    trackEvent("journey_phase_view", {
      persona: mode,
      phase: "Analysis",
      route: getPhaseRoute("Analysis"),
      ts: new Date().toISOString(),
    });
  }, [mode]);

  useEffect(() => {
    if (analysisResult) {
      trackEvent("analysis_ready_view", {
        persona: mode,
        route: getPhaseRoute("Analysis"),
        ts: new Date().toISOString(),
      });
    }
  }, [analysisResult, mode]);

  const handleEnergyInputSubmit = async (data: EnergyInput) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await analyzeViabilityAction(data);

        if (result.success && result.data) {
          setAnalysisResult(result.data);
          setCurrentStep("result");
        } else {
          setError(result.error || "Erro na análise");
        }
      } catch (err) {
        setError("Erro inesperado na análise");
        console.error("Erro na análise:", err);
      }
    });
  };

  const handleNewAnalysis = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Analysis",
      ctaLabel: "Editar dados",
      to: getPhaseRoute("Analysis"),
    });
    setCurrentStep("input");
    setAnalysisResult(null);
    setError(null);
  }, [mode]);

  const handleExport = async () => {
    if (!analysisResult) return;

    try {
      const result = await exportAnalysisResultAction(analysisResult, "json");

      if (result.success && result.data && result.filename) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erro no export:", err);
    }
  };

  const handleShare = () => {
    if (!analysisResult) return;

    const shareData = {
      title: "Análise de Viabilidade - Sistema Fotovoltaico",
      text: analysisResult.summary.headline,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert("Link copiado para a área de transferência!");
    }
  };

  const handleContact = () => {
    const phone = mode === "owner" ? "0800-123-4567" : "comercial@empresa.com";
    const subject = "Análise de Viabilidade - Sistema Fotovoltaico";
    const body = `Olá, gostaria de mais informações sobre a análise de viabilidade realizada.\n\n${analysisResult?.summary.headline}`;

    if (mode === "owner") {
      window.location.href = `tel:${phone}`;
    } else {
      window.location.href = `mailto:${phone}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleProceed = useCallback(() => {
    trackEvent("journey_cta_click", {
      persona: mode,
      phase: "Analysis",
      ctaLabel: "Ir para Dimensionamento",
      to: getPhaseRoute("Dimensioning"),
    });
    skip("Dimensioning");
  }, [mode, skip]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Jornada", href: "/journey" },
            { label: "Análise" },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Análise de Viabilidade
              </h1>
              <p className="text-gray-600">
                {mode === "owner"
                  ? "Descubra se um sistema fotovoltaico é viável para você"
                  : "Análise técnica completa para seu cliente"}
              </p>
            </div>
          </div>

          {currentStep === "result" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="size-4" />
                Compartilhar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="size-4" />
                Exportar
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === "input" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="size-5" />
                  {mode === "owner"
                    ? "Vamos analisar sua viabilidade"
                    : "Análise técnica do projeto"}
                </CardTitle>
                <CardDescription>
                  {mode === "owner"
                    ? "Preencha os dados abaixo para descobrir se um sistema fotovoltaico é uma boa opção para você."
                    : "Forneça os dados técnicos do cliente para uma análise completa de viabilidade."}
                </CardDescription>
              </CardHeader>
            </Card>

            <EnergyInputForm
              onSubmit={handleEnergyInputSubmit}
              isLoading={isPending}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {analysisResult && (
              <ViabilityReport
                result={analysisResult}
                onNewAnalysis={handleNewAnalysis}
                onExport={handleExport}
                onShare={handleShare}
                onContact={handleContact}
              />
            )}

            <NextCTA
              primary={{ label: "Ir para Dimensionamento", onClick: handleProceed }}
              secondary={{ label: "Editar dados", onClick: handleNewAnalysis }}
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
