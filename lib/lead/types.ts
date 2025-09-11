import { z } from "zod";

export const IntentDataSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  persona: z.enum(["owner", "integrator"]).default("owner"),
  goal: z.enum(["viability", "quote", "support", "other"]).default("viability"),
  notes: z.string().max(500).optional(),
});

export type IntentData = z.infer<typeof IntentDataSchema>;

export const LeadValidationResultSchema = z.object({
  isValidLead: z.boolean(),
  status: z.enum(["approved", "incomplete", "unsupported_region"]),
  reasons: z.array(z.string()),
  normalized: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    uf: z.string().optional(),
  }),
  next: z.object({
    primaryCta: z.object({
      label: z.string(),
      href: z.string(),
    }),
    secondaryCta: z.object({
      label: z.string(),
      href: z.string(),
    }).optional(),
  }),
  confidence: z.number().min(0).max(1),
});

export type LeadValidationResult = z.infer<typeof LeadValidationResultSchema>;

