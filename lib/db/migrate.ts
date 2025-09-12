import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running migrations (canonical)...');

  const start = Date.now();
  await migrate(db, { migrationsFolder: './lib/db/migrations' });

  console.log('⏳ Running migrations (custom)...');
  await runCustomMigrations(connection, path.resolve('lib/db/migrations_custom'));
  const end = Date.now();

  console.log('✅ Migrations completed in', end - start, 'ms');
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});

async function runCustomMigrations(
  sql: postgres.Sql<{}>,
  folder: string,
) {
  await ensureCustomMigrationsTable(sql);

  const applied: Array<{ name: string }> = await sql`
    SELECT name FROM "CustomMigrations";
  `;
  const appliedSet = new Set(applied.map((r) => r.name));

  const files = fs
    .readdirSync(folder)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }

    const full = path.join(folder, file);
    const content = fs.readFileSync(full, 'utf8');

    // Split on drizzle marker to run statements individually
    const statements = content
      .split(/--\>\s*statement-breakpoint/g)
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`  → Applying custom migration: ${file}`);

    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt);
      } catch (err: any) {
        const msg = String(err?.message || err);
        // Ignore idempotency errors
        if (
          /already exists/i.test(msg) ||
          /duplicate/i.test(msg) ||
          /column .* exists/i.test(msg)
        ) {
          console.log(`    · Skipped (already applied): ${shorten(stmt)}`);
          continue;
        }
        console.error(`    ✖ Failed statement: ${shorten(stmt)}`);
        throw err;
      }
    }

    await sql`
      INSERT INTO "CustomMigrations" (name) VALUES (${file})
      ON CONFLICT (name) DO NOTHING;
    `;
  }
}

function shorten(s: string) {
  return s.length > 120 ? s.slice(0, 117) + '...' : s;
}

async function ensureCustomMigrationsTable(sql: postgres.Sql<{}>) {
  // Create if missing
  await sql`
    CREATE TABLE IF NOT EXISTS "CustomMigrations" (
      name text PRIMARY KEY,
      runAt timestamp NOT NULL DEFAULT now()
    );
  `;

  // Verify shape; if the 'name' column is missing from an older table, replace it
  try {
    await sql`SELECT name FROM "CustomMigrations" LIMIT 1`;
  } catch (err: any) {
    const code = err?.code || '';
    const msg = String(err?.message || err);
    if (code === '42703' || /column\s+"?name"?\s+does\s+not\s+exist/i.test(msg)) {
      console.warn('⚠️  CustomMigrations has unexpected shape; recreating table');
      await sql`DROP TABLE IF EXISTS "CustomMigrations"`;
      await sql`
        CREATE TABLE IF NOT EXISTS "CustomMigrations" (
          name text PRIMARY KEY,
          runAt timestamp NOT NULL DEFAULT now()
        );
      `;
    } else {
      throw err;
    }
  }
}
