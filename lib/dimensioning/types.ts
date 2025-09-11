import { z } from "zod";

export const SectionSchema = z.object({
  id: z.string(),
  length_m: z.number().min(1),
  width_m: z.number().min(1),
  tilt_deg: z.number().min(0).max(45).optional(),
  azimuth: z.number().min(0).max(360).optional(),
  shading: z.number().min(0).max(0.2).default(0.05).optional(),
});

export const DimensioningInputSchema = z.object({
  persona: z.enum(["owner", "integrator"]).default("owner"),
  site: z.object({
    id: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional()
  }).optional(),
  roof: z.object({
    total_area_m2: z.number().min(5).max(5000).optional(),
    sections: z.array(SectionSchema).optional()
  }).optional(),
  module: z.object({
    preferred: z.enum(["MOD_550", "MOD_450"]).default("MOD_550").optional()
  }).optional(),
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

export type DimensioningInput = z.infer<typeof DimensioningInputSchema>;

export const DimensioningResultSchema = z.object({
  stage: z.literal("dimensioning"),
  inputs: DimensioningInputSchema,
  selection: z.object({
    module: z.string(),
    inverter: z.string(),
    dc_kwp: z.number(),
    ac_kw: z.number(),
    dcac_ratio: z.number(),
  }),
  layout: z.object({
    total_sections: z.number().int(),
    sections: z.array(z.object({
      id: z.string(),
      orientation: z.enum(["portrait", "landscape"]),
      panels_count: z.number().int(),
      panels_rows: z.number().int(),
      panels_cols: z.number().int(),
      used_area_m2: z.number(),
      density_wp_m2: z.number(),
    }))
  }),
  strings: z.object({
    mppts: z.array(z.object({
      mppt_id: z.number().int(),
      strings: z.array(z.object({
        modules: z.number().int(),
        Vmpp_est: z.number(),
        Voc_est: z.number(),
      }))
    }))
  }),
  bom: z.object({
    modules: z.object({
      model: z.string(),
      quantity: z.number().int(),
      wp: z.number()
    }),
    inverter: z.object({
      model: z.string(),
      quantity: z.number().int(),
      ac_kw: z.number()
    }),
    dc_protections: z.array(z.string()),
    ac_protections: z.array(z.string()),
  }),
  notes: z.array(z.string()),
  summary: z.object({
    headline: z.string(),
    bullets: z.array(z.string())
  })
});

export type DimensioningResult = z.infer<typeof DimensioningResultSchema>;