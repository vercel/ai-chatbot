import type { RLSPolicyTemplate, RLSPolicyGroup } from "../schema";

/**
 * Default RLS policy templates
 */
export const DEFAULT_RLS_POLICY_TEMPLATES: Record<string, RLSPolicyTemplate> = {
  workspace_member_select: {
    id: "workspace_member_select",
    name: "Workspace Member Select",
    description: "Allow workspace members to select records",
    policy_type: "select",
    expression: "user_is_workspace_member(workspace_id)",
  },
  workspace_member_insert: {
    id: "workspace_member_insert",
    name: "Workspace Member Insert",
    description: "Allow workspace members to insert records",
    policy_type: "insert",
    expression: "user_is_workspace_member(workspace_id)",
    with_check_expression: "user_is_workspace_member(workspace_id)",
  },
  workspace_member_update: {
    id: "workspace_member_update",
    name: "Workspace Member Update",
    description: "Allow workspace members to update records",
    policy_type: "update",
    expression: "user_is_workspace_member(workspace_id)",
    with_check_expression: "user_is_workspace_member(workspace_id)",
  },
  workspace_member_delete: {
    id: "workspace_member_delete",
    name: "Workspace Member Delete",
    description: "Allow workspace members to delete records",
    policy_type: "delete",
    expression: "user_is_workspace_member(workspace_id)",
  },
  role_based_select: {
    id: "role_based_select",
    name: "Role-Based Select",
    description: "Allow users with specific roles to select records",
    policy_type: "select",
    expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
  },
  role_based_insert: {
    id: "role_based_insert",
    name: "Role-Based Insert",
    description: "Allow users with specific roles to insert records",
    policy_type: "insert",
    expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
    with_check_expression:
      "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
  },
  role_based_update: {
    id: "role_based_update",
    name: "Role-Based Update",
    description: "Allow users with specific roles to update records",
    policy_type: "update",
    expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
    with_check_expression:
      "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
  },
  role_based_delete: {
    id: "role_based_delete",
    name: "Role-Based Delete",
    description: "Allow users with specific roles to delete records",
    policy_type: "delete",
    expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
  },
  public_select: {
    id: "public_select",
    name: "Public Select",
    description: "Allow anyone to select records",
    policy_type: "select",
    expression: "true",
  },
  private_select: {
    id: "private_select",
    name: "Private Select",
    description: "Only allow record owner to select",
    policy_type: "select",
    expression: "created_by = auth.uid()",
  },
  private_insert: {
    id: "private_insert",
    name: "Private Insert",
    description: "Only allow record owner to insert",
    policy_type: "insert",
    expression: "created_by = auth.uid()",
    with_check_expression: "created_by = auth.uid()",
  },
  private_update: {
    id: "private_update",
    name: "Private Update",
    description: "Only allow record owner to update",
    policy_type: "update",
    expression: "created_by = auth.uid()",
    with_check_expression: "created_by = auth.uid()",
  },
  private_delete: {
    id: "private_delete",
    name: "Private Delete",
    description: "Only allow record owner to delete",
    policy_type: "delete",
    expression: "created_by = auth.uid()",
  },
};

/**
 * Default RLS policy groups
 */
export const DEFAULT_RLS_POLICY_GROUPS: Record<string, RLSPolicyGroup> = {
  workspace_member_full: {
    id: "workspace_member_full",
    name: "Workspace Member Full Access",
    description: "Full CRUD access for workspace members",
    policies: [
      DEFAULT_RLS_POLICY_TEMPLATES.workspace_member_select,
      DEFAULT_RLS_POLICY_TEMPLATES.workspace_member_insert,
      DEFAULT_RLS_POLICY_TEMPLATES.workspace_member_update,
      DEFAULT_RLS_POLICY_TEMPLATES.workspace_member_delete,
    ],
  },
  workspace_member_readonly: {
    id: "workspace_member_readonly",
    name: "Workspace Member Read-Only",
    description: "Read-only access for workspace members",
    policies: [DEFAULT_RLS_POLICY_TEMPLATES.workspace_member_select],
  },
  role_based_full: {
    id: "role_based_full",
    name: "Role-Based Full Access",
    description: "Full CRUD access for specific roles",
    policies: [
      DEFAULT_RLS_POLICY_TEMPLATES.role_based_select,
      DEFAULT_RLS_POLICY_TEMPLATES.role_based_insert,
      DEFAULT_RLS_POLICY_TEMPLATES.role_based_update,
      DEFAULT_RLS_POLICY_TEMPLATES.role_based_delete,
    ],
  },
  public_readonly: {
    id: "public_readonly",
    name: "Public Read-Only",
    description: "Public read access, no write access",
    policies: [DEFAULT_RLS_POLICY_TEMPLATES.public_select],
  },
  private_full: {
    id: "private_full",
    name: "Private Full Access",
    description: "Full access only for record owners",
    policies: [
      DEFAULT_RLS_POLICY_TEMPLATES.private_select,
      DEFAULT_RLS_POLICY_TEMPLATES.private_insert,
      DEFAULT_RLS_POLICY_TEMPLATES.private_update,
      DEFAULT_RLS_POLICY_TEMPLATES.private_delete,
    ],
  },
};

/**
 * Gets a default policy template by ID
 */
export function getDefaultPolicyTemplate(
  templateId: string
): RLSPolicyTemplate | null {
  return DEFAULT_RLS_POLICY_TEMPLATES[templateId] ?? null;
}

/**
 * Gets all default policy templates
 */
export function getAllDefaultPolicyTemplates(): RLSPolicyTemplate[] {
  return Object.values(DEFAULT_RLS_POLICY_TEMPLATES);
}

/**
 * Gets a default policy group by ID
 */
export function getDefaultPolicyGroup(
  groupId: string
): RLSPolicyGroup | null {
  return DEFAULT_RLS_POLICY_GROUPS[groupId] ?? null;
}

/**
 * Gets all default policy groups
 */
export function getAllDefaultPolicyGroups(): RLSPolicyGroup[] {
  return Object.values(DEFAULT_RLS_POLICY_GROUPS);
}

/**
 * Creates a custom policy group from template IDs
 */
export function createPolicyGroupFromTemplates(
  id: string,
  name: string,
  description: string | undefined,
  templateIds: string[]
): RLSPolicyGroup {
  const policies = templateIds
    .map((templateId) => getDefaultPolicyTemplate(templateId))
    .filter((template): template is RLSPolicyTemplate => template !== null);

  return {
    id,
    name,
    description,
    policies,
  };
}

