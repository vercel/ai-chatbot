import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dimensionSystem } from "@/lib/dimensioning/service";

const DimensioningInputSchema = z.object({
  persona: z.enum(["owner", "integrator"]).default("owner"),
  site: z.object({ id: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() }).optional(),
  roof: z.object({
    total_area_m2: z.number().min(5).max(5000).optional(),
    sections: z.array(z.object({
      id: z.string(),
      length_m: z.number().min(1),
      width_m: z.number().min(1),
      tilt_deg: z.number().min(0).max(45).optional(),
      azimuth: z.number().min(0).max(360).optional(),
      shading: z.number().min(0).max(0.2).default(0.05).optional(),
    })).optional()
  }).optional(),
  module: z.object({ preferred: z.enum(["MOD_550", "MOD_450"]).default("MOD_550").optional() }).optional(),
  inverter: z.object({
    preferred: z.enum(["INV_5K", "INV_8K", "INV_12K"]).optional(),
    target_dcac: z.number().min(1.05).max(1.5).default(1.2).optional()
  }).optional(),
  constraints: z.object({
    walkway_m: z.number().min(0).max(1).default(0.5).optional(),
    row_gap_m: z.number().min(0).max(0.5).default(0.1).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional()
  }).optional()
}).refine(d => !!(d.roof?.total_area_m2 || d.roof?.sections?.length), {
  message: "Informe área total ou ao menos uma seção."
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = DimensioningInputSchema.parse(body);
    const result = await dimensionSystem(input);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Dimensioning API error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export const runtime = "edge";