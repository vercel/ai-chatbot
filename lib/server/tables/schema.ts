import { z } from "zod";

export const tableIdSchema = z
  .string()
  .min(1, "Table id is required")
  .max(64, "Table id must be 64 characters or fewer")
  .regex(
    /^[a-z0-9_-]+$/,
    "Table id must use lowercase alphanumerics, hyphen, or underscore"
  );

export const labelFieldConfigSchema = z.object({
  field_name: z.string().min(1, "Field name is required"),
  display_name: z.string().optional(),
});

export const relationshipConfigSchema = z.object({
  table_name: z.string().min(1, "Table name is required"),
  foreign_key_column: z.string().min(1, "Foreign key column is required"),
  referenced_table: z.string().min(1, "Referenced table is required"),
  referenced_column: z.string().min(1, "Referenced column is required"),
  label_field: z.string().optional(),
  relationship_type: z.enum(["one_to_one", "one_to_many", "many_to_many"]).optional(),
});

export const fieldMetadataSchema = z.object({
  field_name: z.string().min(1, "Field name is required"),
  display_name: z.string().optional(),
  description: z.string().optional(),
  data_type: z.string().optional(),
  is_required: z.boolean().optional(),
  is_unique: z.boolean().optional(),
  default_value: z.unknown().optional(),
  validation_rules: z.record(z.unknown()).optional(),
  ui_hints: z.record(z.unknown()).optional(),
  visibility_rules: z
    .object({
      roles: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
    })
    .optional(),
});

export const rlsPolicyTemplateSchema = z.object({
  id: z.string().min(1, "Policy ID is required"),
  name: z.string().min(1, "Policy name is required"),
  description: z.string().optional(),
  policy_type: z.enum(["select", "insert", "update", "delete"]),
  expression: z.string().min(1, "Policy expression is required"),
  using_expression: z.string().optional(),
  with_check_expression: z.string().optional(),
});

export const rlsPolicyGroupSchema = z.object({
  id: z.string().min(1, "Group ID is required"),
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  policies: z.array(rlsPolicyTemplateSchema),
});

export const versioningConfigSchema = z.object({
  base_table: z.string().min(1, "Base table name is required"),
  object_type: z.string().min(1, "Object type is required"),
  type_specific_columns: z.array(z.string()).optional(),
  view_name: z.string().optional(),
});

export const tableConfigSchema = z.object({
  label_fields: z.array(labelFieldConfigSchema).optional().default([]),
  relationships: z.array(relationshipConfigSchema).optional().default([]),
  field_metadata: z.array(fieldMetadataSchema).optional().default([]),
  rls_policy_templates: z.array(rlsPolicyTemplateSchema).optional().default([]),
  rls_policy_groups: z.array(rlsPolicyGroupSchema).optional().default([]),
  versioning: versioningConfigSchema.optional(),
  table_type: z.enum(["base_table", "view"]).optional().default("base_table"),
  primary_key_column: z.string().optional(),
  indexes: z
    .array(
      z.object({
        columns: z.array(z.string()).min(1),
        unique: z.boolean().optional().default(false),
        name: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const createTableSchema = z.object({
  id: tableIdSchema,
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: z
    .string()
    .max(512, "Description must be 512 characters or fewer")
    .optional(),
  config: tableConfigSchema.optional().default({}),
});

export const updateTableSchema = z.object({
  id: tableIdSchema.optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: z
    .string()
    .max(512, "Description must be 512 characters or fewer")
    .nullable()
    .optional(),
  config: tableConfigSchema.optional(),
});

export const tableRecordSchema = z.object({
  id: tableIdSchema,
  workspace_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  config: tableConfigSchema,
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type TableId = z.infer<typeof tableIdSchema>;
export type LabelFieldConfig = z.infer<typeof labelFieldConfigSchema>;
export type RelationshipConfig = z.infer<typeof relationshipConfigSchema>;
export type FieldMetadata = z.infer<typeof fieldMetadataSchema>;
export type RLSPolicyTemplate = z.infer<typeof rlsPolicyTemplateSchema>;
export type RLSPolicyGroup = z.infer<typeof rlsPolicyGroupSchema>;
export type VersioningConfig = z.infer<typeof versioningConfigSchema>;
export type TableConfig = z.infer<typeof tableConfigSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type TableRecord = z.infer<typeof tableRecordSchema>;

