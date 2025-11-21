import type { RLSPolicyGroup } from "@/lib/server/tables/schema";

/**
 * Client-safe policy groups for the wizard
 * These match the default policy groups from the server
 */
export const DEFAULT_POLICY_GROUPS: RLSPolicyGroup[] = [
  {
    id: "workspace_member_full",
    name: "Workspace Member Full Access",
    description: "Full CRUD access for workspace members",
    policies: [
      {
        id: "workspace_member_select",
        name: "Workspace Member Select",
        description: "Allow workspace members to select records",
        policy_type: "select",
        expression: "user_is_workspace_member(workspace_id)",
      },
      {
        id: "workspace_member_insert",
        name: "Workspace Member Insert",
        description: "Allow workspace members to insert records",
        policy_type: "insert",
        expression: "user_is_workspace_member(workspace_id)",
        with_check_expression: "user_is_workspace_member(workspace_id)",
      },
      {
        id: "workspace_member_update",
        name: "Workspace Member Update",
        description: "Allow workspace members to update records",
        policy_type: "update",
        expression: "user_is_workspace_member(workspace_id)",
        with_check_expression: "user_is_workspace_member(workspace_id)",
      },
      {
        id: "workspace_member_delete",
        name: "Workspace Member Delete",
        description: "Allow workspace members to delete records",
        policy_type: "delete",
        expression: "user_is_workspace_member(workspace_id)",
      },
    ],
  },
  {
    id: "workspace_member_readonly",
    name: "Workspace Member Read-Only",
    description: "Read-only access for workspace members",
    policies: [
      {
        id: "workspace_member_select",
        name: "Workspace Member Select",
        description: "Allow workspace members to select records",
        policy_type: "select",
        expression: "user_is_workspace_member(workspace_id)",
      },
    ],
  },
  {
    id: "role_based_full",
    name: "Role-Based Full Access",
    description: "Full CRUD access for specific roles",
    policies: [
      {
        id: "role_based_select",
        name: "Role-Based Select",
        description: "Allow users with specific roles to select records",
        policy_type: "select",
        expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
      },
      {
        id: "role_based_insert",
        name: "Role-Based Insert",
        description: "Allow users with specific roles to insert records",
        policy_type: "insert",
        expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
        with_check_expression:
          "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
      },
      {
        id: "role_based_update",
        name: "Role-Based Update",
        description: "Allow users with specific roles to update records",
        policy_type: "update",
        expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
        with_check_expression:
          "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
      },
      {
        id: "role_based_delete",
        name: "Role-Based Delete",
        description: "Allow users with specific roles to delete records",
        policy_type: "delete",
        expression: "user_has_workspace_role(workspace_id, ARRAY['admin', 'dev'])",
      },
    ],
  },
  {
    id: "public_readonly",
    name: "Public Read-Only",
    description: "Public read access, no write access",
    policies: [
      {
        id: "public_select",
        name: "Public Select",
        description: "Allow anyone to select records",
        policy_type: "select",
        expression: "true",
      },
    ],
  },
  {
    id: "private_full",
    name: "Private Full Access",
    description: "Full access only for record owners",
    policies: [
      {
        id: "private_select",
        name: "Private Select",
        description: "Only allow record owner to select",
        policy_type: "select",
        expression: "created_by = auth.uid()",
      },
      {
        id: "private_insert",
        name: "Private Insert",
        description: "Only allow record owner to insert",
        policy_type: "insert",
        expression: "created_by = auth.uid()",
        with_check_expression: "created_by = auth.uid()",
      },
      {
        id: "private_update",
        name: "Private Update",
        description: "Only allow record owner to update",
        policy_type: "update",
        expression: "created_by = auth.uid()",
        with_check_expression: "created_by = auth.uid()",
      },
      {
        id: "private_delete",
        name: "Private Delete",
        description: "Only allow record owner to delete",
        policy_type: "delete",
        expression: "created_by = auth.uid()",
      },
    ],
  },
];

