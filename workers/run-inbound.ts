import { createClient } from 'redis';
import pino from 'pino';
import { InboundConsumer } from './inbound-consumer';

const log = pino({ name: 'inbound-runner', level: process.env.LOG_LEVEL || 'info' });

async function main() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url }) as unknown as any;
  // node-redis exposes the same command names used by our consumer
  await (client as any).connect();

  const consumer = new InboundConsumer(client, {});
  await consumer.init();
  log.info({ stream: process.env.OMNI_STREAM_MESSAGES || 'omni.messages' }, 'inbound_consumer_started');

  // Heartbeat
  const hbKey = 'omni.worker.inbound';
  setInterval(async () => {
    try {
      await (client as any).hSet(hbKey, { status: 'up', ts: String(Date.now()) });
    } catch {}
  }, 5000);

  // Simple loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await consumer.runOnce();
    } catch (err) {
      log.error({ err }, 'inbound_consumer_error');
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

main().catch((err) => {
  log.fatal({ err }, 'inbound_consumer_fatal');
  process.exit(1);
});
