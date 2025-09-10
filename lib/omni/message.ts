import { z } from "zod";

export const TraceSchema = z.object({
  trace_id: z.string(),
});

export const MessageCanonicalSchema = z.object({
  trace: TraceSchema,
  payload: z.any(),
});

export type MessageCanonical = z.infer<typeof MessageCanonicalSchema>;
