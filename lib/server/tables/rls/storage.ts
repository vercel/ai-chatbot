import type {
  RLSPolicyTemplate,
  RLSPolicyGroup,
  TableConfig,
} from "../schema";
import type { TableRecord } from "../schema";

/**
 * Gets RLS policy templates from table config
 */
export function getPolicyTemplates(
  tableConfig: TableRecord
): RLSPolicyTemplate[] {
  return tableConfig.config.rls_policy_templates ?? [];
}

/**
 * Gets RLS policy groups from table config
 */
export function getPolicyGroups(tableConfig: TableRecord): RLSPolicyGroup[] {
  return tableConfig.config.rls_policy_groups ?? [];
}

/**
 * Adds a policy template to table config
 */
export function addPolicyTemplate(
  config: TableConfig,
  template: RLSPolicyTemplate
): TableConfig {
  const templates = config.rls_policy_templates ?? [];
  const existingIndex = templates.findIndex((t) => t.id === template.id);

  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }

  return {
    ...config,
    rls_policy_templates: templates,
  };
}

/**
 * Removes a policy template from table config
 */
export function removePolicyTemplate(
  config: TableConfig,
  templateId: string
): TableConfig {
  const templates = config.rls_policy_templates ?? [];
  return {
    ...config,
    rls_policy_templates: templates.filter((t) => t.id !== templateId),
  };
}

/**
 * Adds a policy group to table config
 */
export function addPolicyGroup(
  config: TableConfig,
  group: RLSPolicyGroup
): TableConfig {
  const groups = config.rls_policy_groups ?? [];
  const existingIndex = groups.findIndex((g) => g.id === group.id);

  if (existingIndex >= 0) {
    groups[existingIndex] = group;
  } else {
    groups.push(group);
  }

  return {
    ...config,
    rls_policy_groups: groups,
  };
}

/**
 * Removes a policy group from table config
 */
export function removePolicyGroup(
  config: TableConfig,
  groupId: string
): TableConfig {
  const groups = config.rls_policy_groups ?? [];
  return {
    ...config,
    rls_policy_groups: groups.filter((g) => g.id !== groupId),
  };
}

/**
 * Gets a policy group by ID from table config
 */
export function getPolicyGroupById(
  tableConfig: TableRecord,
  groupId: string
): RLSPolicyGroup | null {
  const groups = getPolicyGroups(tableConfig);
  return groups.find((g) => g.id === groupId) ?? null;
}

/**
 * Gets a policy template by ID from table config
 */
export function getPolicyTemplateById(
  tableConfig: TableRecord,
  templateId: string
): RLSPolicyTemplate | null {
  const templates = getPolicyTemplates(tableConfig);
  return templates.find((t) => t.id === templateId) ?? null;
}

