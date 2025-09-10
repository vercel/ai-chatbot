import { redis } from "./redis";
import type { MessageCanonical } from "./message";
import { MessageCanonicalSchema } from "./message";
import { DEDUP_TTL } from "./constants";

export async function publish(
  stream: string,
  message: MessageCanonical,
  maxlen?: number,
): Promise<string | null> {
  const parsed = MessageCanonicalSchema.parse(message);
  if (parsed.trace?.trace_id) {
    const key = `omni:trace:${parsed.trace.trace_id}`;
    const res = await redis.sendCommand([
      "SET",
      key,
      "1",
      "PX",
      String(DEDUP_TTL),
      "NX",
    ]);
    if (res === null) return null;
  }

  const payload = JSON.stringify(parsed);
  const args = ["XADD", stream];
  if (maxlen) {
    args.push("MAXLEN", "~", String(maxlen));
  }
  args.push("*", "data", payload);
  const id = (await redis.sendCommand(args)) as string;
  return id;
}

interface ReadOptions {
  stream: string;
  group: string;
  consumer: string;
  blockMs?: number;
  count?: number;
}

interface StreamMessage {
  id: string;
  message: MessageCanonical;
  ack: () => Promise<unknown>;
}

export async function read(options: ReadOptions): Promise<StreamMessage[]> {
  const { stream, group, consumer, blockMs = 0, count = 1 } = options;
  const args = [
    "XREADGROUP",
    "GROUP",
    group,
    consumer,
    "COUNT",
    String(count),
  ];
  if (blockMs) {
    args.push("BLOCK", String(blockMs));
  }
  args.push("STREAMS", stream, ">");
  type XReadGroupResult = [string, [string, string[]][]][];
  const res = (await redis.sendCommand(args)) as XReadGroupResult | null;
  if (!res) return [];

  const messages: StreamMessage[] = [];
  for (const [, entries] of res) {
    for (const [id, fields] of entries) {
      const dataIndex = fields.findIndex(
        (v: string, i: number) => i % 2 === 0 && v === "data",
      );
      const raw = fields[dataIndex + 1];
      const parsed = MessageCanonicalSchema.parse(JSON.parse(raw));
      messages.push({
        id,
        message: parsed,
        ack: () =>
          redis.sendCommand(["XACK", stream, group, id]) as Promise<unknown>,
      });
    }
  }
  return messages;
}
