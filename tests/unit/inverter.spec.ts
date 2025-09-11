import { describe, it, expect } from "vitest";
import { selectInverter } from "../../lib/dimensioning/calc";

describe("selectInverter", () => {
  it("should select smallest suitable inverter", () => {
    const inverter = selectInverter(4, 1.2);
    expect(inverter).toBe("INV_5K");
  });

  it("should select larger inverter if needed", () => {
    const inverter = selectInverter(15, 1.2);
    expect(inverter).toBe("INV_12K");
  });
});