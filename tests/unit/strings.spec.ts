import { describe, it, expect } from "vitest";
import { sizeStrings } from "../../lib/dimensioning/calc";

describe("sizeStrings", () => {
  it("should distribute strings across MPPTs", () => {
    const result = sizeStrings("MOD_550", "INV_8K", 24);
    expect(result.mppts.length).toBe(2); // INV_8K has 2 MPPTs
    const totalStrings = result.mppts.reduce((sum, mppt) => sum + mppt.strings.length, 0);
    expect(totalStrings).toBeGreaterThan(0);
  });
});