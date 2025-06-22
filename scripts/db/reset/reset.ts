import { reset as _reset } from '@/scripts/db/reset/index';

async function reset() {
  await _reset();
}

reset()
  .then(() => {
    console.log('✅ done resetting the database');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ failed to reset the database');
    console.error(err);
    process.exit(1);
  });
