"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { analyzeViability } from "@/lib/analysis/service";
import { EnergyInputSchema, type ViabilityResult } from "@/lib/analysis/types";

// Schema para validação da entrada do action
const AnalyzeViabilityInputSchema = EnergyInputSchema;

/**
 * Server Action para análise de viabilidade
 * Processa dados de entrada e retorna resultado da análise
 */
export async function analyzeViabilityAction(
  input: z.infer<typeof AnalyzeViabilityInputSchema>
): Promise<{
  success: boolean;
  data?: ViabilityResult;
  error?: string;
}> {
  try {
    // Validar entrada
    const validatedInput = AnalyzeViabilityInputSchema.parse(input);

    // Executar análise usando o service layer
    const result = await analyzeViability(validatedInput);

    // Revalidar cache se necessário
    revalidatePath("/journey/analysis");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Erro na análise de viabilidade:", error);

    // Tratamento específico de erros de validação
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Dados inválidos: ${error.errors.map(e => e.message).join(", ")}`,
      };
    }

    // Tratamento genérico de erros
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

/**
 * Server Action para validar dados de entrada
 * Útil para validação em tempo real no frontend
 */
export async function validateEnergyInputAction(
  input: Partial<z.infer<typeof AnalyzeViabilityInputSchema>>
): Promise<{
  success: boolean;
  errors?: Record<string, string>;
}> {
  try {
    // Tentar validar parcialmente
    AnalyzeViabilityInputSchema.parse(input);

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};

      for (const err of error.errors) {
        const field = err.path.join(".");
        fieldErrors[field] = err.message;
      }

      return {
        success: false,
        errors: fieldErrors,
      };
    }

    return {
      success: false,
      errors: { general: "Erro de validação" },
    };
  }
}

/**
 * Server Action para obter dados de exemplo
 * Útil para demonstrações e testes
 */
export async function getSampleAnalysisData(): Promise<{
  success: boolean;
  data?: z.infer<typeof AnalyzeViabilityInputSchema>;
  error?: string;
}> {
  try {
    // Dados de exemplo para SP
    const sampleData = {
      persona: "owner" as const,
      utility: "CPFL",
      uf: "SP" as const,
      avg_kwh_month: 450,
      tariff_rs_kwh: 0.85,
      series_12m: [
        420, 380, 520, 480, 460, 440,
        500, 470, 490, 450, 430, 460
      ],
    };

    // Validar dados de exemplo
    AnalyzeViabilityInputSchema.parse(sampleData);

    return {
      success: true,
      data: sampleData,
    };
  } catch (error) {
    return {
      success: false,
      error: "Erro ao gerar dados de exemplo",
    };
  }
}

/**
 * Server Action para exportar resultado da análise
 * Gera dados para download em diferentes formatos
 */
export async function exportAnalysisResultAction(
  result: ViabilityResult,
  format: "json" | "csv" = "json"
): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    let exportData: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      exportData = JSON.stringify(result, null, 2);
      filename = `analise-viabilidade-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // CSV format
      const csvRows = [
        ["Campo", "Valor"],
        ["Persona", result.inputs.persona],
        ["Consumo Médio (kWh/mês)", result.inputs.avg_kwh_month.toString()],
        ["Tarifa (R$/kWh)", result.inputs.tariff_rs_kwh.toString()],
        ["Sistema Estimado (kWp)", result.estimates.estimated_kwp.toString()],
        ["Geração Mensal (kWh)", result.estimates.gen_month.toString()],
        ["Economia Mensal (R$)", result.estimates.savings_month.toString()],
        ["CAPEX (R$)", result.estimates.capex.toString()],
        ["Payback (anos)", result.estimates.payback_years.toString()],
        ["ROI 5 anos (%)", (result.estimates.roi_5y * 100).toString()],
        ["ROI 10 anos (%)", (result.estimates.roi_10y * 100).toString()],
      ];

      exportData = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
      filename = `analise-viabilidade-${new Date().toISOString().split('T')[0]}.csv`;
    }

    return {
      success: true,
      data: exportData,
      filename,
    };
  } catch (error) {
    console.error("Erro ao exportar resultado da análise:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao exportar dados",
    };
  }
}