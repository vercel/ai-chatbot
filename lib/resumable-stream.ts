import { createClient } from 'redis';
import { generateUUID } from './utils';

const redisUrl = process.env.REDIS_KV_URL;

if (!redisUrl) {
  throw new Error('REDIS_KV_URL environment variable is not set');
}

const redisPublisher = createClient({
  url: redisUrl,
});

const redisSubscriber = createClient({
  url: redisUrl,
});

const connectPromise = Promise.all([
  redisSubscriber.connect(),
  redisPublisher.connect(),
]);

interface ResumeStreamMessage {
  listenerId: string;
}

const DONE_MESSAGE = 'STREAM_DONE';

export async function createResumableStream({
  chatId,
  stream,
}: {
  chatId: string;
  stream?: ReadableStream<string>;
}) {
  const lines: Array<string> = [];
  const listenerChannels = new Set<string>();

  await connectPromise;

  const currentListenerCount = await redisPublisher.get(
    `stream:room:${chatId}`,
  );

  if (!currentListenerCount && !stream) {
    return null;
  }

  if (!currentListenerCount && stream) {
    await redisPublisher.incr(`stream:room:${chatId}`);
  }

  if (Number.parseInt(currentListenerCount ?? '0') > 0 && !stream) {
    return resumeStream({ chatId });
  }

  await redisSubscriber.subscribe(
    `stream:join:${chatId}`,
    async (message: string) => {
      const { listenerId } = JSON.parse(message) as ResumeStreamMessage;
      listenerChannels.add(listenerId);

      redisPublisher.publish(`stream:content:${listenerId}`, lines.join(''));
    },
  );

  if (!stream) {
    return null;
  }

  const reader = stream.getReader();

  const responseStream = new ReadableStream<string>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();

          const promises: Array<Promise<unknown>> = [];

          if (done) {
            promises.push(redisPublisher.del(`stream:room:${chatId}`));
            promises.push(redisSubscriber.unsubscribe(`stream:join:${chatId}`));

            for (const listenerId of listenerChannels) {
              promises.push(
                redisPublisher.publish(
                  `stream:content:${listenerId}`,
                  DONE_MESSAGE,
                ),
              );
            }

            await Promise.all(promises);

            controller.close();
            break;
          } else {
            lines.push(value);
            controller.enqueue(value);

            for (const listenerId of listenerChannels) {
              promises.push(
                redisPublisher.publish(`stream:content:${listenerId}`, value),
              );
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  });

  return responseStream;
}

export async function resumeStream({ chatId }: { chatId: string }) {
  const listenerId = generateUUID();

  await redisPublisher.incr(`stream:room:${chatId}`);

  const resumedStream = new ReadableStream({
    async start(controller) {
      await redisSubscriber.subscribe(
        `stream:content:${listenerId}`,
        async (message) => {
          if (message === DONE_MESSAGE) {
            controller.close();
          } else {
            controller.enqueue(message);
          }
        },
      );

      await redisPublisher.publish(
        `stream:join:${chatId}`,
        JSON.stringify({
          listenerId,
        }),
      );
    },
  });

  return resumedStream;
}
