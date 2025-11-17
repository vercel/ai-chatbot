import postgres from "postgres";
import {
  BaseSqlAdapter,
  type AdapterContext,
  type ResourceAdapterKind,
} from "./base";

export type PostgresAdapterContext = AdapterContext & {
  sslMode?: "prefer" | "require" | "disable";
};

export class PostgresResourceAdapter extends BaseSqlAdapter {
  readonly kind: ResourceAdapterKind = "postgres";

  constructor(private readonly pgContext: PostgresAdapterContext) {
    super(pgContext);
  }

  protected createSqlClient() {
    const connectionString = this.resolveConnectionString();
    const sslMode = this.pgContext.sslMode ?? "prefer";

    return postgres(connectionString, {
      ssl:
        sslMode === "disable"
          ? undefined
          : {
              rejectUnauthorized: sslMode === "require",
            },
    });
  }

  private resolveConnectionString(): string {
    const { credentialRef, configuration } = this.pgContext;
    const config = configuration ?? {};

    const metadataConnection =
      (config.connectionString as string | undefined) ??
      (config.url as string | undefined) ??
      (config.databaseUrl as string | undefined) ??
      (config.connection_url as string | undefined) ??
      (config.jdbcUrl as string | undefined);

    if (metadataConnection) {
      return metadataConnection;
    }

    if (credentialRef?.startsWith("env:")) {
      const variableName = credentialRef.slice(4);
      const envValue = process.env[variableName];
      if (!envValue) {
        throw new Error(
          `Missing environment variable ${variableName} for Postgres adapter`
        );
      }
      return envValue;
    }

    if (credentialRef) {
      return credentialRef;
    }

    throw new Error("Unable to resolve Postgres connection string");
  }
}




