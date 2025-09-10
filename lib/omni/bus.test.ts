import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("./redis", () => ({
  redis: {
    sendCommand: vi.fn(),
  },
}));

import { publish, read } from "./bus";
import { redis } from "./redis";
import type { MessageCanonical } from "./message";

const mock = redis.sendCommand as unknown as Mock;

describe("omni bus", () => {
  beforeEach(() => {
    mock.mockReset();
  });

  it("publishes message", async () => {
    mock.mockResolvedValueOnce("OK").mockResolvedValueOnce("1-0");
    const msg = { trace: { trace_id: "t1" }, payload: { foo: "bar" } };
    const id = await publish("stream", msg);
    expect(id).toBe("1-0");
    expect(mock.mock.calls[0][0][0]).toBe("SET");
    expect(mock.mock.calls[1][0][0]).toBe("XADD");
  });

  it("dedups by trace id", async () => {
    mock.mockResolvedValueOnce(null);
    const msg = { trace: { trace_id: "t1" }, payload: {} };
    const id = await publish("stream", msg);
    expect(id).toBeNull();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("reads messages and ack", async () => {
    const message = { trace: { trace_id: "t2" }, payload: { a: 1 } };
    mock.mockResolvedValueOnce([
      ["stream", [["1-0", ["data", JSON.stringify(message)]]]],
    ]);
    const [item] = await read({
      stream: "stream",
      group: "group",
      consumer: "c",
      blockMs: 1,
    });
    expect(item.message).toEqual(message);
    mock.mockResolvedValueOnce(1);
    await item.ack();
    expect(mock.mock.calls[1][0][0]).toBe("XACK");
  });

  it("fails to publish invalid payload", async () => {
    const bad = { foo: "bar" } as unknown as MessageCanonical;
    await expect(publish("stream", bad)).rejects.toBeTruthy();
  });
});
