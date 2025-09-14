import { createClient } from 'redis';
import pino from 'pino';
import { Dispatcher } from './dispatcher';

const log = pino({ name: 'dispatcher-runner', level: process.env.LOG_LEVEL || 'info' });

async function main() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url }) as unknown as any;
  await (client as any).connect();

  const disp = new Dispatcher(client, {});
  await disp.init();
  log.info({ stream: process.env.OMNI_STREAM_OUTBOX || 'omni.outbox' }, 'dispatcher_started');

  // Heartbeat
  const hbKey = 'omni.worker.dispatcher';
  setInterval(async () => {
    try {
      await (client as any).hSet(hbKey, { status: 'up', ts: String(Date.now()) });
    } catch {}
  }, 5000);

  // Loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await disp.runOnce();
    } catch (err) {
      log.error({ err }, 'dispatcher_error');
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

main().catch((err) => {
  log.fatal({ err }, 'dispatcher_fatal');
  process.exit(1);
});

