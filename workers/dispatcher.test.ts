import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dispatcher } from "./dispatcher";
import * as whatsapp from "../adapters/whatsapp/sender";

interface PendingInfo {
  consumer: string;
  timestamp: number;
  message: { id: string; message: Record<string, string> };
}

interface StreamState {
  messages: Array<{ id: string; message: Record<string, string> }>;
  groups: Map<string, { lastIndex: number }>;
  pending: Map<string, PendingInfo>;
  nextId: number;
}

class FakeRedis {
  streams = new Map<string, StreamState>();
  hashes = new Map<string, Record<string, string>>();

  async xAdd(stream: string, _id: string, message: Record<string, string>) {
    const s = this.streams.get(stream) ?? {
      messages: [] as Array<{ id: string; message: Record<string, string> }>,
      groups: new Map<string, { lastIndex: number }>(),
      pending: new Map<string, PendingInfo>(),
      nextId: 1,
    };
    const msgId = `${s.nextId}-0`;
    s.nextId++;
    const msg = { id: msgId, message };
    s.messages.push(msg);
    this.streams.set(stream, s);
    return msgId;
  }

  async xGroupCreate(stream: string, group: string) {
    const s = this.streams.get(stream) ?? {
      messages: [] as Array<{ id: string; message: Record<string, string> }>,
      groups: new Map<string, { lastIndex: number }>(),
      pending: new Map<string, PendingInfo>(),
      nextId: 1,
    };
    if (s.groups.has(group)) throw new Error("BUSYGROUP");
    s.groups.set(group, { lastIndex: 0 });
    this.streams.set(stream, s);
  }

  async xReadGroup(_group: string, consumer: string, keys: Array<{ key: string }>) {
    const key = keys[0].key;
    const s = this.streams.get(key);
    if (!s) return null;
    const g = s.groups.get("dispatcher");
    if (!g) return null;
    if (g.lastIndex >= s.messages.length) return null;
    const msg = s.messages[g.lastIndex];
    g.lastIndex++;
    s.pending.set(msg.id, { consumer, timestamp: Date.now(), message: msg });
    return [{ name: key, messages: [msg] }];
  }

  async xAutoClaim(stream: string, _group: string, consumer: string, minIdle: number) {
    const s = this.streams.get(stream);
    if (!s) return ["0-0", []] as const;
    const now = Date.now();
    const claimed: Array<{ id: string; message: Record<string, string> }> = [];
    for (const [id, info] of s.pending) {
      if (now - info.timestamp >= minIdle) {
        info.consumer = consumer;
        info.timestamp = now;
        claimed.push({ id, message: info.message.message });
      }
    }
    return ["0-0", claimed] as const;
  }

  async xAck(stream: string, _group: string, id: string) {
    const s = this.streams.get(stream);
    if (!s) return 0;
    return s.pending.delete(id) ? 1 : 0;
  }

  async hSet(key: string, obj: Record<string, string>) {
    const h = this.hashes.get(key) ?? {};
    Object.assign(h, obj);
    this.hashes.set(key, h);
    return 1;
  }
}

describe("dispatcher", () => {
  let redis: FakeRedis;
  let dispatcher: Dispatcher;

  beforeEach(async () => {
    redis = new FakeRedis();
    dispatcher = new Dispatcher(redis, { retryMs: 0, pollMs: 0 });
    await dispatcher.init();
    vi.resetAllMocks();
  });

  it("envio bem-sucedido (ack)", async () => {
    const id = await redis.xAdd("omni.outbox", "*", {
      payload: JSON.stringify({ to: { kind: "whatsapp", contact: "123" }, text: "oi" }),
    });
    const spy = vi.spyOn(whatsapp, "sendWhatsappMCP").mockResolvedValue({ status: "sent" });
    await dispatcher.runOnce();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(redis.hashes.get(`status:${id}`)).toEqual({ status: "sent" });
    expect(redis.streams.get("omni.outbox").pending.size).toBe(0);
  });

  it("falha de MCP → nack + retry", async () => {
    const id = await redis.xAdd("omni.outbox", "*", {
      payload: JSON.stringify({ to: { kind: "whatsapp", contact: "123" }, text: "oi" }),
    });
    const spy = vi
      .spyOn(whatsapp, "sendWhatsappMCP")
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ status: "sent" });
    await dispatcher.runOnce();
    expect(redis.hashes.get(`status:${id}`)).toEqual({ status: "failed" });
    expect(redis.streams.get("omni.outbox").pending.size).toBe(1);
    await dispatcher.runOnce();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(redis.hashes.get(`status:${id}`)).toEqual({ status: "sent" });
    expect(redis.streams.get("omni.outbox").pending.size).toBe(0);
  });

  it("mensagem malformada → dead-letter", async () => {
    await redis.xAdd("omni.outbox", "*", { payload: "{" });
    const spy = vi.spyOn(whatsapp, "sendWhatsappMCP");
    await dispatcher.runOnce();
    expect(spy).not.toHaveBeenCalled();
    expect(redis.streams.get("omni.outbox").pending.size).toBe(0);
    expect(redis.streams.get("omni.dlq").messages.length).toBe(1);
  });
});
