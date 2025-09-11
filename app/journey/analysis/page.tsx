"use client";

import { useState, useTransition } from "react";
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

/**
 * Página de demonstração do módulo de análise de viabilidade
 * Integra EnergyInput e ViabilityReport em um fluxo completo
 */
export default function AnalysisPage() {
  const router = useRouter();
  const { mode } = usePersona();
  const [isPending, startTransition] = useTransition();

  // Estados do componente
  const [currentStep, setCurrentStep] = useState<"input" | "result">("input");
  const [analysisResult, setAnalysisResult] = useState<ViabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handler para submissão dos dados de energia
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

  // Handler para nova análise
  const handleNewAnalysis = () => {
    setCurrentStep("input");
    setAnalysisResult(null);
    setError(null);
  };

  // Handler para exportar resultado
  const handleExport = async () => {
    if (!analysisResult) return;

    try {
      const result = await exportAnalysisResultAction(analysisResult, "json");

      if (result.success && result.data && result.filename) {
        // Criar blob e download
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

  // Handler para compartilhar
  const handleShare = () => {
    if (!analysisResult) return;

    // Implementação simplificada de compartilhamento
    const shareData = {
      title: "Análise de Viabilidade - Sistema Fotovoltaico",
      text: analysisResult.summary.headline,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert("Link copiado para a área de transferência!");
    }
  };

  // Handler para contato
  const handleContact = () => {
    // Implementação simplificada de contato
    const phone = mode === "owner" ? "0800-123-4567" : "comercial@empresa.com";
    const subject = "Análise de Viabilidade - Sistema Fotovoltaico";
    const body = `Olá, gostaria de mais informações sobre a análise de viabilidade realizada.\n\n${analysisResult?.summary.headline}`;

    if (mode === "owner") {
      window.location.href = `tel:${phone}`;
    } else {
      window.location.href = `mailto:${phone}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
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
                  : "Análise técnica completa para seu cliente"
                }
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

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Jornada</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Análise</span>
          {currentStep === "result" && (
            <>
              <span>/</span>
              <span className="text-blue-600 font-medium">Resultado</span>
            </>
          )}
        </nav>

        {/* Conteúdo principal */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === "input" ? (
          <div className="space-y-6">
            {/* Card de introdução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="size-5" />
                  {mode === "owner"
                    ? "Vamos analisar sua viabilidade"
                    : "Análise técnica do projeto"
                  }
                </CardTitle>
                <CardDescription>
                  {mode === "owner"
                    ? "Preencha os dados abaixo para descobrir se um sistema fotovoltaico é uma boa opção para você."
                    : "Forneça os dados técnicos do cliente para uma análise completa de viabilidade."
                  }
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Formulário de entrada */}
            <EnergyInputForm
              onSubmit={handleEnergyInputSubmit}
              isLoading={isPending}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resultado da análise */}
            {analysisResult && (
              <ViabilityReport
                result={analysisResult}
                onNewAnalysis={handleNewAnalysis}
                onExport={handleExport}
                onShare={handleShare}
                onContact={handleContact}
              />
            )}

            {/* Ações rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos passos</CardTitle>
                <CardDescription>
                  {mode === "owner"
                    ? "Baseado na análise, aqui estão suas opções:"
                    : "Ações recomendadas para este projeto:"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleContact}
                    className="flex items-center gap-2 h-auto p-4"
                    variant="default"
                  >
                    <Phone className="size-5" />
                    <div className="text-left">
                      <div className="font-medium">Falar com especialista</div>
                      <div className="text-sm opacity-90">
                        {mode === "owner" ? "Tirar dúvidas" : "Enviar proposta"}
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleNewAnalysis}
                    className="flex items-center gap-2 h-auto p-4"
                    variant="outline"
                  >
                    <Calculator className="size-5" />
                    <div className="text-left">
                      <div className="font-medium">Nova análise</div>
                      <div className="text-sm opacity-90">Testar outros cenários</div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleExport}
                    className="flex items-center gap-2 h-auto p-4"
                    variant="outline"
                  >
                    <Download className="size-5" />
                    <div className="text-left">
                      <div className="font-medium">Exportar relatório</div>
                      <div className="text-sm opacity-90">Salvar para referência</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}