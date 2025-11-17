import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { workspaceApp } from "@/lib/db/schema";
import { readLocalEnv, upsertLocalEnv } from "@/lib/server/local-env";
import type { TenantContext } from "@/lib/server/tenant/context";

export const workspaceAppTypeSchema = z.enum(["postgres", "openai"]);
export type WorkspaceAppType = z.infer<typeof workspaceAppTypeSchema>;

const sslModeSchema = z.enum(["prefer", "require", "disable"]).default("prefer");

const postgresConfigSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5432),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  schema: z.string().optional(),
  sslMode: sslModeSchema,
});

const openAiConfigSchema = z.object({
  apiKey: z.string().min(8, "API key is required"),
  organization: z.string().optional(),
});

export type PostgresConfigInput = z.infer<typeof postgresConfigSchema>;
export type OpenAiConfigInput = z.infer<typeof openAiConfigSchema>;

export type ConnectedAppSummary = {
  id?: string;
  type: WorkspaceAppType;
  configured: boolean;
  source: "database" | "env";
  updatedAt?: string;
  metadata?: Record<string, unknown>;
};

type WorkspaceAppRow = typeof workspaceApp.$inferSelect;

export async function getWorkspaceAppSummary(
  tenant: TenantContext,
  type: WorkspaceAppType
): Promise<ConnectedAppSummary> {
  if (tenant.mode === "local") {
    return getLocalWorkspaceAppSummary(type);
  }
  return getHostedWorkspaceAppSummary(tenant.workspaceId, type);
}

export async function savePostgresWorkspaceApp(
  tenant: TenantContext,
  payload: unknown
): Promise<ConnectedAppSummary> {
  const input = postgresConfigSchema.parse(payload);

  const connectionString = buildPostgresConnectionString(input);

  if (tenant.mode === "local") {
    await upsertLocalEnv({
      POSTGRES_URL: connectionString,
      DATABASE_URL: connectionString,
    });
    return {
      type: "postgres",
      configured: true,
      source: "env",
      updatedAt: new Date().toISOString(),
      metadata: buildPostgresMetadataFromInput(input),
    };
  }

  const metadata = {
    ...buildPostgresMetadataFromInput(input),
    updatedBy: tenant.userId,
    updatedAt: new Date().toISOString(),
  };

  await upsertWorkspaceApp({
    workspaceId: tenant.workspaceId,
    type: "postgres",
    credentialRef: connectionString,
    metadata,
  });

  return getHostedWorkspaceAppSummary(tenant.workspaceId, "postgres");
}

export async function saveOpenAiWorkspaceApp(
  tenant: TenantContext,
  payload: unknown
): Promise<ConnectedAppSummary> {
  const input = openAiConfigSchema.parse(payload);
  const sanitizedKey = input.apiKey.trim();

  if (tenant.mode === "local") {
    await upsertLocalEnv({ OPENAI_API_KEY: sanitizedKey });
    return {
      type: "openai",
      configured: true,
      source: "env",
      updatedAt: new Date().toISOString(),
      metadata: {
        provider: "openai",
        maskedKey: maskSecret(sanitizedKey),
        organization: input.organization ?? null,
      },
    };
  }

  const metadata = {
    provider: "openai",
    organization: input.organization ?? null,
    maskedKey: maskSecret(sanitizedKey),
    updatedBy: tenant.userId,
    updatedAt: new Date().toISOString(),
  };

  await upsertWorkspaceApp({
    workspaceId: tenant.workspaceId,
    type: "openai",
    credentialRef: sanitizedKey,
    metadata,
  });

  return getHostedWorkspaceAppSummary(tenant.workspaceId, "openai");
}

async function getHostedWorkspaceAppSummary(
  workspaceId: string,
  type: WorkspaceAppType
): Promise<ConnectedAppSummary> {
  const record = await findWorkspaceApp(workspaceId, type);
  if (!record) {
    return {
      type,
      configured: false,
      source: "database",
    };
  }

  return {
    id: record.id,
    type,
    configured: true,
    source: "database",
    updatedAt: serializeDate(record.updated_at),
    metadata: record.metadata ?? {},
  };
}

async function getLocalWorkspaceAppSummary(
  type: WorkspaceAppType
): Promise<ConnectedAppSummary> {
  if (type === "postgres") {
    const env = await readLocalEnv(["POSTGRES_URL", "DATABASE_URL"]);
    const connectionString = env.POSTGRES_URL ?? env.DATABASE_URL;
    if (!connectionString) {
      return {
        type,
        configured: false,
        source: "env",
      };
    }

    return {
      type,
      configured: true,
      source: "env",
      metadata: {
        ...buildPostgresMetadataFromConnectionString(connectionString),
        connectionString,
      },
    };
  }

  const env = await readLocalEnv(["OPENAI_API_KEY"]);
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      type,
      configured: false,
      source: "env",
    };
  }

  return {
    type,
    configured: true,
    source: "env",
    metadata: {
      provider: "openai",
      maskedKey: maskSecret(apiKey),
    },
  };
}

async function findWorkspaceApp(
  workspaceId: string,
  type: WorkspaceAppType
): Promise<WorkspaceAppRow | undefined> {
  return withDb((db) => findWorkspaceAppWithDb(db, workspaceId, type));
}

async function findWorkspaceAppWithDb(
  db: ReturnType<typeof drizzle>,
  workspaceId: string,
  type: WorkspaceAppType
): Promise<WorkspaceAppRow | undefined> {
  const [record] = await db
    .select()
    .from(workspaceApp)
    .where(
      and(
        eq(workspaceApp.workspace_id, workspaceId),
        eq(workspaceApp.type, type)
      )
    )
    .limit(1);

  return record;
}

async function upsertWorkspaceApp(options: {
  workspaceId: string;
  type: WorkspaceAppType;
  credentialRef: string;
  metadata: Record<string, unknown>;
}) {
  await withDb(async (db) => {
    const existing = await findWorkspaceAppWithDb(
      db,
      options.workspaceId,
      options.type
    );

    if (existing) {
      await db
        .update(workspaceApp)
        .set({
          credential_ref: options.credentialRef,
          metadata: options.metadata,
          updated_at: new Date(),
        })
        .where(eq(workspaceApp.id, existing.id));
      return;
    }

    await db.insert(workspaceApp).values({
      workspace_id: options.workspaceId,
      type: options.type,
      credential_ref: options.credentialRef,
      metadata: options.metadata,
    });
  });
}

function buildPostgresConnectionString(config: PostgresConfigInput): string {
  const user = encodeURIComponent(config.username);
  const password = config.password
    ? `:${encodeURIComponent(config.password)}`
    : "";
  const schemaParam = config.schema
    ? `?schema=${encodeURIComponent(config.schema)}`
    : "";
  return `postgresql://${user}${password}@${config.host}:${config.port}/${config.database}${schemaParam}`;
}

function buildPostgresMetadataFromInput(
  input: PostgresConfigInput
): Record<string, unknown> {
  return {
    variant: "postgres",
    host: input.host,
    port: input.port,
    database: input.database,
    username: input.username,
    schema: input.schema ?? null,
    sslMode: input.sslMode,
  };
}

function buildPostgresMetadataFromConnectionString(
  connectionString: string
): Record<string, unknown> {
  try {
    const url = new URL(connectionString);
    const schema = url.searchParams.get("schema");
    return {
      variant: "postgres",
      host: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      database: url.pathname.replace(/^\//, ""),
      username: decodeURIComponent(url.username),
      schema: schema ?? null,
    };
  } catch {
    return {
      variant: "postgres",
    };
  }
}

function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return "****";
  }

  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}****${suffix}`;
}

function serializeDate(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

async function withDb<T>(callback: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(sql);

  try {
    return await callback(db);
  } finally {
    await sql.end({ timeout: 5 });
  }
}


