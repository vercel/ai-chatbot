/**
 * TiQology Database Scalability Configuration
 * Postgres optimization, RLS policies, indexing strategies
 */

/**
 * Database Indexing Strategy
 * Creates optimal indexes for query performance
 */
export const indexingStrategy = {
  // Core tables
  users: [
    { columns: ["email"], type: "unique", name: "idx_users_email" },
    { columns: ["created_at"], type: "btree", name: "idx_users_created_at" },
    { columns: ["updated_at"], type: "btree", name: "idx_users_updated_at" },
  ],

  chats: [
    { columns: ["user_id"], type: "btree", name: "idx_chats_user_id" },
    { columns: ["created_at"], type: "btree", name: "idx_chats_created_at" },
    { columns: ["visibility"], type: "btree", name: "idx_chats_visibility" },
    {
      columns: ["user_id", "created_at"],
      type: "btree",
      name: "idx_chats_user_created",
    },
  ],

  messages: [
    { columns: ["chat_id"], type: "btree", name: "idx_messages_chat_id" },
    { columns: ["created_at"], type: "btree", name: "idx_messages_created_at" },
    { columns: ["role"], type: "btree", name: "idx_messages_role" },
    {
      columns: ["chat_id", "created_at"],
      type: "btree",
      name: "idx_messages_chat_created",
    },
  ],

  documents: [
    { columns: ["user_id"], type: "btree", name: "idx_documents_user_id" },
    {
      columns: ["created_at"],
      type: "btree",
      name: "idx_documents_created_at",
    },
    { columns: ["kind"], type: "btree", name: "idx_documents_kind" },
  ],

  votes: [
    { columns: ["chat_id"], type: "btree", name: "idx_votes_chat_id" },
    { columns: ["message_id"], type: "btree", name: "idx_votes_message_id" },
  ],

  suggestions: [
    {
      columns: ["document_id"],
      type: "btree",
      name: "idx_suggestions_document_id",
    },
    { columns: ["user_id"], type: "btree", name: "idx_suggestions_user_id" },
    {
      columns: ["created_at"],
      type: "btree",
      name: "idx_suggestions_created_at",
    },
  ],
};

/**
 * SQL for creating all indexes
 */
export function generateIndexSQL(): string[] {
  const sqlStatements: string[] = [];

  for (const [table, indexes] of Object.entries(indexingStrategy)) {
    for (const index of indexes) {
      const indexType = index.type === "unique" ? "UNIQUE INDEX" : "INDEX";
      const columns = index.columns.join(", ");

      sqlStatements.push(
        `CREATE ${indexType} IF NOT EXISTS ${index.name} ON ${table} (${columns});`
      );
    }
  }

  return sqlStatements;
}

/**
 * Row Level Security (RLS) Policies
 */
export const rlsPolicies = {
  users: {
    enable: "ALTER TABLE users ENABLE ROW LEVEL SECURITY;",
    policies: [
      {
        name: "users_select_own",
        operation: "SELECT",
        using: "auth.uid() = id",
      },
      {
        name: "users_update_own",
        operation: "UPDATE",
        using: "auth.uid() = id",
      },
    ],
  },

  chats: {
    enable: "ALTER TABLE chats ENABLE ROW LEVEL SECURITY;",
    policies: [
      {
        name: "chats_select_own",
        operation: "SELECT",
        using: "user_id = auth.uid() OR visibility = 'public'",
      },
      {
        name: "chats_insert_own",
        operation: "INSERT",
        withCheck: "user_id = auth.uid()",
      },
      {
        name: "chats_update_own",
        operation: "UPDATE",
        using: "user_id = auth.uid()",
      },
      {
        name: "chats_delete_own",
        operation: "DELETE",
        using: "user_id = auth.uid()",
      },
    ],
  },

  messages: {
    enable: "ALTER TABLE messages ENABLE ROW LEVEL SECURITY;",
    policies: [
      {
        name: "messages_select_chat_access",
        operation: "SELECT",
        using:
          "EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user_id = auth.uid() OR chats.visibility = 'public'))",
      },
      {
        name: "messages_insert_chat_owner",
        operation: "INSERT",
        withCheck:
          "EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())",
      },
    ],
  },

  documents: {
    enable: "ALTER TABLE documents ENABLE ROW LEVEL SECURITY;",
    policies: [
      {
        name: "documents_select_own",
        operation: "SELECT",
        using: "user_id = auth.uid()",
      },
      {
        name: "documents_insert_own",
        operation: "INSERT",
        withCheck: "user_id = auth.uid()",
      },
      {
        name: "documents_update_own",
        operation: "UPDATE",
        using: "user_id = auth.uid()",
      },
      {
        name: "documents_delete_own",
        operation: "DELETE",
        using: "user_id = auth.uid()",
      },
    ],
  },

  votes: {
    enable: "ALTER TABLE votes ENABLE ROW LEVEL SECURITY;",
    policies: [
      {
        name: "votes_select_all",
        operation: "SELECT",
        using: "true",
      },
      {
        name: "votes_insert_chat_access",
        operation: "INSERT",
        withCheck:
          "EXISTS (SELECT 1 FROM chats WHERE chats.id = votes.chat_id AND chats.user_id = auth.uid())",
      },
    ],
  },

  suggestions: {
    enable: "ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;",
    policies: [
      {
        name: "suggestions_select_document_access",
        operation: "SELECT",
        using:
          "EXISTS (SELECT 1 FROM documents WHERE documents.id = suggestions.document_id AND documents.user_id = auth.uid())",
      },
      {
        name: "suggestions_insert_document_access",
        operation: "INSERT",
        withCheck:
          "EXISTS (SELECT 1 FROM documents WHERE documents.id = suggestions.document_id AND documents.user_id = auth.uid())",
      },
    ],
  },
};

/**
 * Generate RLS policy SQL
 */
export function generateRLSPolicySQL(): string[] {
  const sqlStatements: string[] = [];

  for (const [table, config] of Object.entries(rlsPolicies)) {
    sqlStatements.push(config.enable);

    for (const policy of config.policies) {
      const policyType = policy.operation;
      const using = (policy as any).using || "true";
      const withCheck = (policy as any).withCheck;

      let sql = `CREATE POLICY ${policy.name} ON ${table} FOR ${policyType} USING (${using})`;

      if (withCheck) {
        sql += ` WITH CHECK (${withCheck})`;
      }

      sql += ";";
      sqlStatements.push(sql);
    }
  }

  return sqlStatements;
}

/**
 * Legacy function for compatibility
 */
function generateRLSPolicySQLLegacy(): string[] {
  const sqlStatements: string[] = [];

  for (const [table, config] of Object.entries(rlsPolicies)) {
    // Enable RLS
    sqlStatements.push(config.enable);

    // Create policies
    for (const policy of config.policies) {
      const policyAny = policy as any;
      let sql = `CREATE POLICY ${policy.name} ON ${table}`;
      sql += ` FOR ${policy.operation}`;

      if (policyAny.using) {
        sql += ` USING (${policyAny.using})`;
      }

      if (policyAny.withCheck) {
        sql += ` WITH CHECK (${policyAny.withCheck})`;
      }

      sql += ";";
      sqlStatements.push(sql);
    }
  }

  return sqlStatements;
}

/**
 * Database Optimization Configuration
 */
export const optimizationConfig = {
  // Connection pooling
  connectionPool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2000,
  },

  // Query optimization
  queryOptimization: {
    preparedStatements: true,
    statementTimeout: 30_000, // 30 seconds
    lockTimeout: 5000, // 5 seconds
  },

  // Caching
  caching: {
    enableQueryCache: true,
    cacheTTL: 300, // 5 minutes
    maxCacheSize: 100, // MB
  },

  // Partitioning strategy
  partitioning: {
    messages: {
      type: "RANGE",
      column: "created_at",
      interval: "MONTH",
    },
    chats: {
      type: "RANGE",
      column: "created_at",
      interval: "YEAR",
    },
  },
};

/**
 * Database maintenance queries
 */
export const maintenanceQueries = {
  // Vacuum tables
  vacuum: (tableName: string) => `VACUUM ANALYZE ${tableName};`,

  // Reindex tables
  reindex: (tableName: string) => `REINDEX TABLE ${tableName};`,

  // Update statistics
  analyze: (tableName: string) => `ANALYZE ${tableName};`,

  // Check bloat
  checkBloat: `
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `,

  // Check slow queries
  slowQueries: `
    SELECT
      query,
      calls,
      total_time,
      mean_time,
      max_time
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 20;
  `,

  // Check table sizes
  tableSizes: `
    SELECT
      schemaname as schema,
      tablename as table,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS data_size,
      pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `,

  // Check index usage
  indexUsage: `
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    ORDER BY idx_scan ASC;
  `,
};

/**
 * Create partitioning for large tables
 */
export function generatePartitionSQL(
  tableName: string,
  column: string,
  interval: "MONTH" | "YEAR"
): string[] {
  const sqlStatements: string[] = [];

  // Create parent table as partitioned
  sqlStatements.push(`
    ALTER TABLE ${tableName} 
    SET (autovacuum_enabled = true);
  `);

  // Note: Actual partitioning would require table recreation
  // This is a simplified example

  return sqlStatements;
}

/**
 * Database health check queries
 */
export const healthCheckQueries = {
  // Check connection count
  connectionCount: `
    SELECT count(*) as connection_count
    FROM pg_stat_activity
    WHERE state = 'active';
  `,

  // Check replication lag (if using replicas)
  replicationLag: `
    SELECT
      client_addr,
      state,
      sent_lsn,
      write_lsn,
      flush_lsn,
      replay_lsn,
      sync_state
    FROM pg_stat_replication;
  `,

  // Check locks
  locks: `
    SELECT
      pg_stat_activity.pid,
      pg_class.relname,
      pg_locks.mode,
      pg_stat_activity.query
    FROM pg_locks
    JOIN pg_class ON pg_locks.relation = pg_class.oid
    JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
    WHERE pg_locks.granted = false;
  `,

  // Check database size
  databaseSize: `
    SELECT
      pg_size_pretty(pg_database_size(current_database())) as db_size;
  `,
};

/**
 * Apply all database optimizations
 */
export async function applyDatabaseOptimizations(db: any): Promise<{
  success: boolean;
  applied: string[];
  errors: string[];
}> {
  const applied: string[] = [];
  const errors: string[] = [];

  try {
    // Create indexes
    const indexSQL = generateIndexSQL();
    for (const sql of indexSQL) {
      try {
        await db.execute(sql);
        applied.push(`Index: ${sql.slice(0, 50)}...`);
      } catch (error) {
        errors.push(`Index failed: ${error}`);
      }
    }

    // Setup RLS policies
    const rlsSQL = generateRLSPolicySQL();
    for (const sql of rlsSQL) {
      try {
        await db.execute(sql);
        applied.push(`RLS: ${sql.slice(0, 50)}...`);
      } catch (error) {
        errors.push(`RLS failed: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      applied,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      applied,
      errors: [`Critical error: ${error}`],
    };
  }
}

/**
 * Database monitoring utilities
 */
export class DatabaseMonitor {
  private db: any;
  private metrics: Map<string, any> = new Map();

  constructor(db: any) {
    this.db = db;
  }

  async collectMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    try {
      // Connection count
      const connResult = await this.db.execute(
        healthCheckQueries.connectionCount
      );
      metrics.connectionCount = connResult.rows[0]?.connection_count || 0;

      // Database size
      const sizeResult = await this.db.execute(healthCheckQueries.databaseSize);
      metrics.databaseSize = sizeResult.rows[0]?.db_size || "0 bytes";

      // Table sizes
      const tablesResult = await this.db.execute(maintenanceQueries.tableSizes);
      metrics.tableSizes = tablesResult.rows;

      // Index usage
      const indexResult = await this.db.execute(maintenanceQueries.indexUsage);
      metrics.indexUsage = indexResult.rows;

      this.metrics.set("latest", { ...metrics, timestamp: Date.now() });
      return metrics;
    } catch (error) {
      console.error("Failed to collect database metrics:", error);
      return {};
    }
  }

  async performMaintenance(): Promise<boolean> {
    try {
      const tables = [
        "users",
        "chats",
        "messages",
        "documents",
        "votes",
        "suggestions",
      ];

      for (const table of tables) {
        await this.db.execute(maintenanceQueries.vacuum(table));
        await this.db.execute(maintenanceQueries.analyze(table));
      }

      return true;
    } catch (error) {
      console.error("Database maintenance failed:", error);
      return false;
    }
  }

  getMetricsHistory(): any[] {
    return Array.from(this.metrics.values());
  }
}
