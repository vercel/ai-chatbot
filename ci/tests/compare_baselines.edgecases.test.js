// ci/tests/compare_baselines.edgecases.test.js
import {
  compareTimes,
  extractExecutionMs,
} from "../../ci/scripts/compare_baselines.js";

describe("compare_baselines helpers - edge cases", () => {
  test("planner-only explain (no Execution Time) returns null", () => {
    const plannerOnly = {
      Plan: { "Node Type": "Seq Scan", "Total Cost": 100.0 },
    };
    const res = extractExecutionMs(plannerOnly);
    expect(res).toBeNull();
  });
  test("string explain containing Execution Time is parsed", () => {
    const str =
      "Seq Scan on table  (cost=0.00..18.20 rows=820 width=4)\nExecution Time: 12.345 ms\n";
    const res = extractExecutionMs(str);
    expect(res).toBeCloseTo(12.345, 3);
  });
  test("malformed explain JSON returns null without throwing", () => {
    expect(() => extractExecutionMs(undefined)).not.toThrow();
    const res = extractExecutionMs(undefined);
    expect(res).toBeNull();
  });
  test("zero baseline time handled (avoid divide by zero) - treated as regressed if current > abs threshold", () => {
    const baselineMs = 0;
    const currentMs = 200;
    const res = compareTimes({
      baselineMs,
      currentMs,
      pct_threshold: 25,
      abs_threshold: 150,
    });
    expect(res.status).toBe("REGRESSED");
  });
  test("zero baseline and small current leads to NEW_BASELINE", () => {
    const baselineMs = 0;
    const currentMs = 10;
    const res = compareTimes({
      baselineMs,
      currentMs,
      pct_threshold: 25,
      abs_threshold: 150,
    });
    expect(res.status).toBe("NEW_BASELINE");
  });
  test("very large times compute pct correctly", () => {
    const baselineMs = 100_000;
    const currentMs = 200_000;
    const res = compareTimes({ baselineMs, currentMs });
    expect(res.pct).toBeCloseTo(100);
    expect(res.status).toBe("REGRESSED");
  });
  test("negative delta (improved) returns OK", () => {
    const res = compareTimes({ baselineMs: 200, currentMs: 100 });
    expect(res.status).toBe("OK");
  });
});
