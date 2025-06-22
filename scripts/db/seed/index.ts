import { count, type InferInsertModel } from 'drizzle-orm';
import { db as srcDb } from '@/lib/db/f3/queries';
import { db as dstDb } from '@/lib/db/script-connection';
import { backblast as srcBackblast } from '@/lib/db/f3/migrations/schema';
import { backblast as dstBackblast } from '@/lib/db/schema.f3';
import { generateSk } from '@/lib/db/utils.f3';

type DstBackblast = InferInsertModel<typeof dstBackblast>;

export async function seed() {
  console.debug('🌱 seeding database...');
  await seedBackblasts();
}

async function seedBackblasts() {
  console.debug('seeding backblasts...');
  const [res] = await srcDb.select({ total: count() }).from(srcBackblast);
  const total = res?.total;
  console.debug(`seeding ${total} backblasts...`);
  const backblasts = fetchBackblasts();
  let i = 0;
  for await (const bb of backblasts) {
    i += 1;
    const { sk, ...rest } = bb;
    await dstDb
      .insert(dstBackblast)
      .values(bb)
      .onConflictDoUpdate({
        target: [dstBackblast.sk],
        set: rest,
      });
    console.debug(`inserted backblast ${i} of ${total}: ${sk}`);
  }
  console.debug(`seeded ${i} of ${total} backblasts`);
}

async function* fetchBackblasts(): AsyncGenerator<DstBackblast> {
  const bbs = await srcDb
    .select()
    .from(srcBackblast)
    .orderBy(srcBackblast.date, srcBackblast.ao);
  console.debug(`fetched ${bbs.length} backblasts`);
  for (let i = 0; i < bbs.length; i++) {
    const bb = bbs[i];
    const date = bb.date;
    const ao = bb.ao ?? '';
    const q = bb.q ?? '';
    yield {
      sk: generateSk(date, ao, q),
      date: date,
      ao: ao,
      q: q,
      pax_count: bb.paxCount,
      fngs: bb.fngs,
      fng_count: bb.fngCount ?? 0,
      backblast: bb.backblast,
    } as DstBackblast;
  }
}
