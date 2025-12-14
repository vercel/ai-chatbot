// Simple unit tests for compare_baselines.js
const assert = require("assert");
const { extractTotalMs } = require("./compare_baselines");

describe("extractTotalMs", () => {
  it("should extract Execution Time from ANALYZE", () => {
    const input = { mode: "ANALYZE", explain: [{ ExecutionTime: 123.45 }] };
    assert.strictEqual(extractTotalMs(input), 123.45);
  });
  it("should extract Execution Time from nested Plan", () => {
    const input = {
      mode: "ANALYZE",
      explain: [{ Plan: { ExecutionTime: 99.9 } }],
    };
    assert.strictEqual(extractTotalMs(input), 99.9);
  });
  it("should return null if no Execution Time", () => {
    const input = { mode: "ANALYZE", explain: [{}] };
    assert.strictEqual(extractTotalMs(input), null);
  });
  it("should extract TotalCost from planner", () => {
    const input = { mode: "PLANNER", explain: [{ Plan: { TotalCost: 42 } }] };
    assert.strictEqual(extractTotalMs(input), 42);
  });
});
