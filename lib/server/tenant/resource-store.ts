import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { asc, eq } from "drizzle-orm";
import { type WorkspaceApp, workspaceApp } from "@/lib/db/schema";
import {
  type AdapterContext,
  BaseSqlAdapter,
  type DbClient,
  isSqlAdapter,
  type ResourceAdapter,
} from "./adapters/base";
import { PostgresResourceAdapter } from "./adapters/postgres";
import { ZapierResourceAdapter } from "./adapters/zapier";
import type { TenantContext } from "./context";

export type ResourceStoreOptions = {
  connectionId?: string | null;
};

export type WorkspaceConnection = Pick<
  WorkspaceApp,
  "id" | "type" | "credential_ref" | "metadata"
>;

class LocalSqlAdapter extends BaseSqlAdapter {
  readonly kind = "local" as const;

  constructor(context: AdapterContext) {
    super(context);
  }

  protected createSqlClient() {
    return postgres(process.env.POSTGRES_URL!);
  }
}

export class ResourceStore<A extends ResourceAdapter = ResourceAdapter> {
  constructor(
    private readonly adapter: A,
    private readonly tenant: TenantContext,
  ) {}

  get workspaceId(): string {
    return this.tenant.workspaceId;
  }

  get mode() {
    return this.tenant.mode;
  }

  get roles() {
    return this.tenant.roles;
  }

  getAdapter(): A {
    return this.adapter;
  }

  async withSqlClient<T>(callback: (db: DbClient) => Promise<T>): Promise<T> {
    if (!isSqlAdapter(this.adapter)) {
      throw new Error("SQL adapter required for this operation");
    }

    return this.adapter.withDb(callback);
  }

  async dispose(): Promise<void> {
    await this.adapter.dispose();
  }
}

export async function getResourceStore(
  tenant: TenantContext,
  options: ResourceStoreOptions = {},
): Promise<ResourceStore> {
  if (tenant.mode === "local") {
    const adapter = new LocalSqlAdapter({
      workspaceId: tenant.workspaceId,
      connectionId: options.connectionId ?? tenant.connectionId,
    });
    await adapter.initialize();
    return new ResourceStore(adapter, tenant);
  }

  const sql = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(sql);

  try {
    const connection = await resolveWorkspaceConnection(
      db,
      tenant.workspaceId,
      options.connectionId ?? tenant.connectionId,
    );

    const adapter = await createAdapterForConnection(connection, tenant);
    await adapter.initialize();

    return new ResourceStore(adapter, tenant);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function resolveWorkspaceConnection(
  db: ReturnType<typeof drizzle>,
  workspaceId: string,
  explicitConnectionId: string | null | undefined,
): Promise<WorkspaceConnection> {
  if (explicitConnectionId) {
    const [connection] = await db
      .select({
        id: workspaceApp.id,
        type: workspaceApp.type,
        credential_ref: workspaceApp.credential_ref,
        metadata: workspaceApp.metadata,
      })
      .from(workspaceApp)
      .where(eq(workspaceApp.id, explicitConnectionId))
      .limit(1);

    if (!connection) {
      throw new Error(`Connection ${explicitConnectionId} not found`);
    }

    return connection;
  }

  const [defaultConnection] = await db
    .select({
      id: workspaceApp.id,
      type: workspaceApp.type,
      credential_ref: workspaceApp.credential_ref,
      metadata: workspaceApp.metadata,
    })
    .from(workspaceApp)
    .where(eq(workspaceApp.workspace_id, workspaceId))
    .orderBy(asc(workspaceApp.created_at))
    .limit(1);

  if (!defaultConnection) {
    throw new Error(
      `No resource connection configured for workspace ${workspaceId}`,
    );
  }

  return defaultConnection;
}

async function createAdapterForConnection(
  connection: WorkspaceConnection,
  tenant: TenantContext,
): Promise<ResourceAdapter> {
  const baseContext: AdapterContext = {
    workspaceId: tenant.workspaceId,
    connectionId: connection.id,
    credentialRef: connection.credential_ref,
    configuration: connection.metadata as Record<string, unknown>,
  };

  switch (connection.type) {
    case "postgres":
      return new PostgresResourceAdapter(baseContext);
    case "zapier":
      return new ZapierResourceAdapter(baseContext);
    case "neon":
    case "planetscale":
      throw new Error(`Adapter for ${connection.type} is not implemented yet`);
    default:
      throw new Error(`Unsupported connection type: ${connection.type}`);
  }
}
