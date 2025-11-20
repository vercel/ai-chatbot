#!/usr/bin/env tsx

import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { user, workspace, workspaceApp, workspaceUser } from "../lib/db/schema";

// Load environment variables
config({ path: ".env.local" });

type ProvisionOptions = {
    workspaceName: string;
    workspaceSlug: string;
    mode: "local" | "hosted";
    ownerEmail?: string;
    credentialRef?: string;
};

async function parseArgs(): Promise<ProvisionOptions> {
    const args = process.argv.slice(2);
    const options: ProvisionOptions = {
        workspaceName: process.env.DEFAULT_WORKSPACE_NAME ?? "Local Workspace",
        workspaceSlug: process.env.DEFAULT_WORKSPACE_SLUG ?? "default",
        mode: (process.env.APP_MODE as "local" | "hosted" | undefined) ??
            "local",
        ownerEmail: process.env.DEFAULT_WORKSPACE_OWNER_EMAIL,
        credentialRef: process.env.DEFAULT_WORKSPACE_CONNECTION_REF,
    };

    for (const arg of args) {
        const [key, value] = arg.split("=");
        if (!value) {
            continue;
        }

        switch (key) {
            case "--workspace-name":
                options.workspaceName = value;
                break;
            case "--workspace-slug":
                options.workspaceSlug = value;
                break;
            case "--mode":
                if (value === "local" || value === "hosted") {
                    options.mode = value;
                }
                break;
            case "--owner-email":
                options.ownerEmail = value;
                break;
            case "--credential-ref":
                options.credentialRef = value;
                break;
            default:
                break;
        }
    }

    return options;
}

async function provisionWorkspace(options: ProvisionOptions) {
    if (!process.env.POSTGRES_URL) {
        throw new Error(
            "POSTGRES_URL environment variable is not set. Make sure .env.local exists and contains POSTGRES_URL.",
        );
    }

    const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
    const db = drizzle(sql);

    try {
        const [existingWorkspace] = await db
            .select()
            .from(workspace)
            .where(eq(workspace.slug, options.workspaceSlug))
            .limit(1);

        const workspaceId = existingWorkspace?.id ??
            (
                await db
                    .insert(workspace)
                    .values({
                        id: randomUUID(),
                        name: options.workspaceName,
                        slug: options.workspaceSlug,
                        mode: options.mode,
                        metadata: {},
                    })
                    .returning({ id: workspace.id })
            )[0].id;

        let ownerId: string | undefined;

        if (options.ownerEmail) {
            const [owner] = await db
                .select({ id: user.id })
                .from(user)
                .where(eq(user.email, options.ownerEmail))
                .limit(1);

            ownerId = owner?.id;

            if (ownerId) {
                const [membership] = await db
                    .select({ id: workspaceUser.id })
                    .from(workspaceUser)
                    .where(
                        and(
                            eq(workspaceUser.workspace_id, workspaceId),
                            eq(workspaceUser.user_id, ownerId),
                        ),
                    )
                    .limit(1);

                if (!membership) {
                    await db.insert(workspaceUser).values({
                        workspace_id: workspaceId,
                        user_id: ownerId,
                        role_id: "admin",
                        metadata: {},
                    });
                }

                await db
                    .update(workspace)
                    .set({ owner_user_id: ownerId })
                    .where(eq(workspace.id, workspaceId));
            }
        }

        if (options.mode === "local") {
            const credentialRef = options.credentialRef ?? "env:POSTGRES_URL";

            const [existingConnection] = await db
                .select({ id: workspaceApp.id })
                .from(workspaceApp)
                .where(eq(workspaceApp.workspace_id, workspaceId))
                .limit(1);

            if (!existingConnection) {
                await db.insert(workspaceApp).values({
                    workspace_id: workspaceId,
                    type: "postgres",
                    credential_ref: credentialRef,
                    metadata: {},
                });
            }
        }

        console.info(
            `Workspace ${options.workspaceSlug} (${workspaceId}) provisioned successfully${
                ownerId ? ` with owner ${ownerId}` : ""
            }.`,
        );
    } finally {
        await sql.end({ timeout: 5 });
    }
}

async function main() {
    const options = await parseArgs();
    await provisionWorkspace(options);
}

void main();
