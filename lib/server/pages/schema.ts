import { z } from "zod";

export const pageIdSchema = z
  .string()
  .min(1, "Page id is required")
  .max(64, "Page id must be 64 characters or fewer")
  .regex(/^[a-z0-9_-]+$/, "Page id must use lowercase alphanumerics, hyphen, or underscore");

export const pageBlockPositionSchema = z.object({
  x: z.number().int().nonnegative().default(0),
  y: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().default(12),
  height: z.number().int().positive().default(4),
});

export const pageBlockTypeSchema = z.enum(["list", "record", "report", "trigger"]);

export const pageBlockSchema = z.object({
  id: z.string().min(1, "Block id is required"),
  type: pageBlockTypeSchema,
  position: pageBlockPositionSchema.optional(),
  dataSource: z.record(z.string(), z.unknown()).optional(),
  displayConfig: z.record(z.string(), z.unknown()).optional(),
});

export const pageUrlParamSchema = z.object({
  name: z
    .string()
    .min(1, "URL parameter name is required")
    .max(64, "URL parameter name must be 64 characters or fewer"),
  required: z.boolean().default(true),
  description: z
    .string()
    .max(256, "URL parameter description must be 256 characters or fewer")
    .optional(),
});

export const pageSettingsSchema = z
  .object({
    urlParams: z.array(pageUrlParamSchema).optional(),
    hideHeader: z.boolean().optional(),
  })
  .catchall(z.unknown())
  .default({});

export const pageLayoutSchema = z.record(z.string(), z.unknown()).default({});

export const createPageSchema = z.object({
  id: pageIdSchema,
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: z
    .string()
    .max(512, "Description must be 512 characters or fewer")
    .optional(),
  blocks: z.array(pageBlockSchema).optional().default([]),
  layout: pageLayoutSchema.optional().default({}),
  settings: pageSettingsSchema.optional().default({}),
});

export const updatePageSchema = z.object({
  id: pageIdSchema.optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: z
    .string()
    .max(512, "Description must be 512 characters or fewer")
    .nullable()
    .optional(),
  layout: pageLayoutSchema.optional(),
  blocks: z.array(pageBlockSchema).optional(),
  settings: pageSettingsSchema.optional(),
});

export const pageRecordSchema = z.object({
  id: pageIdSchema,
  workspace_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  layout: pageLayoutSchema,
  blocks: z.array(pageBlockSchema),
  settings: pageSettingsSchema,
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PageId = z.infer<typeof pageIdSchema>;
export type PageBlock = z.infer<typeof pageBlockSchema>;
export type PageSettings = z.infer<typeof pageSettingsSchema>;
export type PageLayout = z.infer<typeof pageLayoutSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type PageRecord = z.infer<typeof pageRecordSchema>;

