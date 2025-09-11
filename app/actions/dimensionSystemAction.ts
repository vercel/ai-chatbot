"use server";

import { revalidatePath } from "next/cache";
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

export async function dimensionSystemAction(formData: FormData): Promise<{
  success: boolean;
  data?: unknown;
  errors?: Record<string, string[]>;
}> {
  try {
    const rawData: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        try {
          rawData[key] = JSON.parse(value);
        } catch {
          rawData[key] = value;
        }
      } else {
        rawData[key] = value;
      }
    }

    const input = DimensioningInputSchema.parse(rawData);
    const result = await dimensionSystem(input);

    revalidatePath("/journey/dimensioning");

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      for (const err of error.errors) {
        const path = err.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      }
      return { success: false, errors };
    }

    console.error("Dimensioning action error:", error);
    return { success: false, errors: { general: ["Erro interno no servidor"] } };
  }
}