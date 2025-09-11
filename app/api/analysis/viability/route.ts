import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeViability } from "@/lib/analysis/service";
import { EnergyInputSchema } from "@/lib/analysis/types";

// Schema para validação da requisição
const AnalyzeViabilityRequestSchema = z.object({
  input: EnergyInputSchema,
  options: z.object({
    includeDetails: z.boolean().default(false),
    format: z.enum(["json", "xml"]).default("json"),
  }).optional(),
});

/**
 * POST /api/analysis/viability
 * Endpoint para análise de viabilidade via API
 */
export async function POST(request: NextRequest) {
  try {
    // Parse do corpo da requisição
    const body = await request.json();

    // Validar entrada
    const { input, options } = AnalyzeViabilityRequestSchema.parse(body);

    // Executar análise
    const result = await analyzeViability(input);

    // Formatar resposta baseada nas opções
    const includeDetails = options?.includeDetails ?? false;
    const format = options?.format ?? "json";

    if (format === "xml") {
      // Resposta em XML (simplificada)
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<viabilityAnalysis>
  <stage>${result.stage}</stage>
  <inputs>
    <persona>${result.inputs.persona}</persona>
    <avgKwhMonth>${result.inputs.avg_kwh_month}</avgKwhMonth>
    <tariffRsKwh>${result.inputs.tariff_rs_kwh}</tariffRsKwh>
  </inputs>
  <estimates>
    <estimatedKwp>${result.estimates.estimated_kwp}</estimatedKwp>
    <genMonth>${result.estimates.gen_month}</genMonth>
    <savingsMonth>${result.estimates.savings_month}</savingsMonth>
    <capex>${result.estimates.capex}</capex>
    <paybackYears>${result.estimates.payback_years}</paybackYears>
    <roi5y>${result.estimates.roi_5y}</roi5y>
    <roi10y>${result.estimates.roi_10y}</roi10y>
  </estimates>
  <summary>
    <headline>${result.summary.headline}</headline>
    <bullets>
      ${result.summary.bullets.map(bullet => `<bullet>${bullet}</bullet>`).join('\n      ')}
    </bullets>
  </summary>
  ${includeDetails ? `
  <assumptions>
    <PR>${result.assumptions.PR}</PR>
    <kwhPerKwpMonth>${result.assumptions.kwh_per_kwp_month}</kwhPerKwpMonth>
    <capexPerKwp>${result.assumptions.capex_per_kwp}</capexPerKwp>
  </assumptions>` : ''}
</viabilityAnalysis>`;

      return new NextResponse(xmlResponse, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=300", // Cache por 5 minutos
        },
      });
    }

    // Resposta padrão em JSON
    const jsonResponse = {
      success: true,
      data: includeDetails ? result : {
        stage: result.stage,
        inputs: result.inputs,
        estimates: result.estimates,
        summary: result.summary,
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    return NextResponse.json(jsonResponse, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300", // Cache por 5 minutos
      },
    });

  } catch (error) {
    console.error("Erro na API de análise de viabilidade:", error);

    // Tratamento específico de erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Dados inválidos",
        details: error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message,
        })),
      }, { status: 400 });
    }

    // Tratamento genérico de erros
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }, { status: 500 });
  }
}

/**
 * GET /api/analysis/viability
 * Endpoint para obter informações sobre a API
 */
export async function GET() {
  const apiInfo = {
    name: "YSH Viability Analysis API",
    version: "1.0.0",
    description: "API para análise de viabilidade de sistemas fotovoltaicos",
    endpoints: {
      POST: {
        path: "/api/analysis/viability",
        description: "Executar análise de viabilidade",
        body: {
          input: "EnergyInput object (ver schema)",
          options: {
            includeDetails: "boolean (default: false)",
            format: "json | xml (default: json)"
          }
        }
      }
    },
    schemas: {
      EnergyInput: {
        persona: "owner | integrator",
        utility: "string (optional)",
        uf: "UF code (optional)",
        avg_kwh_month: "number (optional)",
        series_12m: "number[] (optional, max 12)",
        tariff_rs_kwh: "number (optional)",
        attachments: "Attachment[] (optional)"
      }
    },
    examples: {
      curl: `curl -X POST http://localhost:3000/api/analysis/viability \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "persona": "owner",
      "avg_kwh_month": 450,
      "tariff_rs_kwh": 0.85,
      "uf": "SP"
    }
  }'`
    }
  };

  return NextResponse.json(apiInfo, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600", // Cache por 1 hora
    },
  });
}

/**
 * OPTIONS /api/analysis/viability
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // 24 horas
    },
  });
}