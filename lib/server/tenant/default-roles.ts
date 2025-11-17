import { and, eq } from "drizzle-orm";
import { role } from "@/lib/db/schema";
import type { DbClient } from "./context";

type RoleDefinition = {
  id: string;
  label: string;
  description: string;
  level: number;
};

export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "admin",
    label: "Admin",
    description: "Full access to all workspace features",
    level: 100,
  },
  {
    id: "dev",
    label: "Developer",
    description: "Developer access for building automations and integrations",
    level: 60,
  },
  {
    id: "staff",
    label: "Staff",
    description: "Operational access for day-to-day activities",
    level: 40,
  },
  {
    id: "user",
    label: "User",
    description: "Basic access for end users",
    level: 20,
  },
];

export async function seedDefaultRoles(db: DbClient, workspaceId: string) {
  for (const definition of DEFAULT_ROLE_DEFINITIONS) {
    const [existingRole] = await db
      .select({ id: role.id })
      .from(role)
      .where(
        and(
          eq(role.workspace_id, workspaceId),
          eq(role.id, definition.id)
        )
      )
      .limit(1);

    if (existingRole) {
      continue;
    }

    await db
      .insert(role)
      .values({
        workspace_id: workspaceId,
        id: definition.id,
        label: definition.label,
        description: definition.description,
        level: definition.level,
      })
      .onConflictDoNothing();
  }
}



