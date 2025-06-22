import { db } from '@/lib/db/script-connection';
import { count } from 'drizzle-orm';
import { backblast } from '@/lib/db/schema.f3';

export async function reset() {
  console.debug('🔄 resetting database...');
  await resetBackblasts();
}

export async function resetBackblasts() {
  console.debug('resetting backblasts...');
  const [res] = await db.select({ total: count() }).from(backblast);
  const total = res?.total;
  console.debug(`deleting ${total} backblasts...`);
  await db.delete(backblast).execute();
  console.debug(`deleted ${total} backblasts`);
}
