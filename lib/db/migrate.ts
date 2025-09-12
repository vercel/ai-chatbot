import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local' });

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(sql);

  const start = Date.now();
  console.log('⏳ Running migrations...');
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  await sql.end({ timeout: 5 });
  console.log(`✅ Migrations completed in ${Date.now() - start} ms`);
}

main().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
