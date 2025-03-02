import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as fs from 'fs';
import * as path from 'path';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  const client = createClient({
    url: process.env.DATABASE_URL || 'file:./local.db',
  });
  const db = drizzle(client);

  console.log('⏳ Running migrations...');
  const start = Date.now();

  try {
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'lib/db/migrations-sqlite/0000_superb_sir_ram.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split statements at statement-breakpoint
    const statements = sql.split('--> statement-breakpoint').map(stmt => stmt.trim()).filter(Boolean);

    // Execute each statement
    for (const statement of statements) {
      await client.execute(statement);
      console.log(`✓ Executed statement`);
    }

    const end = Date.now();
    console.log('✅ Migrations completed in', end - start, 'ms');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed');
    console.error(err);
    process.exit(1);
  }
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
