import { seed as _seed } from '@/scripts/db/seed/index';

async function seed() {
  await _seed();
}

seed()
  .then(() => {
    console.log('✅ done seeding the database');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ failed to seed the database');
    console.error(err);
    process.exit(1);
  });
