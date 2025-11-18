import type { TableRecord, LabelFieldConfig, RelationshipConfig } from "./schema";
import { getTableConfig } from "./repository";
import type { TenantContext } from "@/lib/server/tenant/context";

type LabelFieldCache = Map<string, LabelFieldConfig | null>;

const labelFieldCache = new Map<string, LabelFieldCache>();

/**
 * Gets the label field configuration for a referenced table
 */
export async function getLabelFieldForTable(
  tenant: TenantContext,
  referencedTableName: string
): Promise<LabelFieldConfig | null> {
  const cacheKey = `${tenant.workspaceId}:${referencedTableName}`;
  const workspaceCache =
    labelFieldCache.get(tenant.workspaceId) ?? new Map<string, LabelFieldConfig | null>();

  if (workspaceCache.has(referencedTableName)) {
    return workspaceCache.get(referencedTableName) ?? null;
  }

  try {
    // Try to get table config by table name (assuming id matches table name)
    const tableConfig = await getTableConfig(tenant, referencedTableName);

    if (!tableConfig) {
      workspaceCache.set(referencedTableName, null);
      labelFieldCache.set(tenant.workspaceId, workspaceCache);
      return null;
    }

    const labelFields = tableConfig.config.label_fields ?? [];
    const labelField = labelFields[0] ?? null;

    workspaceCache.set(referencedTableName, labelField);
    labelFieldCache.set(tenant.workspaceId, workspaceCache);
    return labelField;
  } catch {
    workspaceCache.set(referencedTableName, null);
    labelFieldCache.set(tenant.workspaceId, workspaceCache);
    return null;
  }
}

/**
 * Gets label field for a relationship
 */
export async function getLabelFieldForRelationship(
  tenant: TenantContext,
  relationship: RelationshipConfig
): Promise<LabelFieldConfig | null> {
  // If relationship has explicit label_field, use it
  if (relationship.label_field) {
    return {
      field_name: relationship.label_field,
      display_name: relationship.label_field,
    };
  }

  // Otherwise, get from referenced table config
  return getLabelFieldForTable(tenant, relationship.referenced_table);
}

/**
 * Resolves label field value for a foreign key
 * Returns the field name that should be used to display the referenced record
 */
export async function resolveLabelField(
  tenant: TenantContext,
  tableConfig: TableRecord,
  foreignKeyColumn: string
): Promise<{
  labelField: string;
  referencedTable: string;
  relationship: RelationshipConfig | null;
} | null> {
  const relationships = tableConfig.config.relationships ?? [];

  // Find relationship for this foreign key
  const relationship = relationships.find(
    (rel) => rel.foreign_key_column === foreignKeyColumn
  );

  if (!relationship) {
    return null;
  }

  const labelFieldConfig = await getLabelFieldForRelationship(tenant, relationship);

  if (!labelFieldConfig) {
    // Default to the referenced table's primary key or first column
    return {
      labelField: relationship.referenced_column,
      referencedTable: relationship.referenced_table,
      relationship,
    };
  }

  return {
    labelField: labelFieldConfig.field_name,
    referencedTable: relationship.referenced_table,
    relationship,
  };
}

/**
 * Clears the label field cache for a workspace
 */
export function clearLabelFieldCache(workspaceId: string): void {
  labelFieldCache.delete(workspaceId);
}

/**
 * Clears all label field caches
 */
export function clearAllLabelFieldCaches(): void {
  labelFieldCache.clear();
}

