import { z } from "zod";

export const DetectionRequestSchema = z.object({
  persona: z.enum(["owner","integrator"]).default("owner"),
  files: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number().int().nonnegative(),
    blobUrl: z.string().url().optional()
  })).min(1)
});
export type DetectionRequest = z.infer<typeof DetectionRequestSchema>;

export const BBoxSchema = z.object({ x:z.number(), y:z.number(), w:z.number(), h:z.number(), score:z.number().optional() });
export const DetectionItemSchema = z.object({
  input: z.object({ name:z.string(), url:z.string().url(), width:z.number().optional(), height:z.number().optional() }),
  overlays: z.object({
    maskUrl: z.string().url().optional(),
    bboxes: z.array(BBoxSchema).optional()
  }).optional(),
  metrics: z.object({
    roof_coverage_m2: z.number().optional(),
    panel_count: z.number().int().optional(),
    confidence: z.number().min(0).max(1).optional(),
    orientation: z.enum(["N","S","L","O","NE","NW","SE","SW"]).optional(),
    tilt_deg: z.number().optional(),
  }).optional(),
  notes: z.array(z.string()).optional()
});

export const DetectionResultSchema = z.object({
  stage: z.literal("detection"),
  site: z.object({ lat:z.number().optional(), lng:z.number().optional() }).optional(),
  items: z.array(DetectionItemSchema),
  summary: z.object({
    roof_total_m2: z.number().optional(),
    detected_panels: z.number().int().optional(),
    confidence_avg: z.number().min(0).max(1).optional(),
    recommendations: z.array(z.string())
  })
});
export type DetectionResult = z.infer<typeof DetectionResultSchema>;