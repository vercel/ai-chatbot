import { describe, it, expect } from "vitest";
import { packPanelsInSection, selectInverter, sizeStrings, buildBOM } from "../../lib/dimensioning/calc";

describe("packPanelsInSection", () => {
  it("should pack panels in portrait orientation", () => {
    const result = packPanelsInSection(
      { length_m: 10, width_m: 5, shading: 0.05 },
      { length_m: 2, width_m: 1, area_m2: 2 },
      { walkway_m: 0.5, row_gap_m: 0.1, orientation: "portrait" }
    );
    expect(result.orientation).toBe("portrait");
    expect(result.count).toBeGreaterThan(0);
  });

  it("should calculate used area correctly", () => {
    const result = packPanelsInSection(
      { length_m: 10, width_m: 5, shading: 0.05 },
      { length_m: 2, width_m: 1, area_m2: 2 },
      { walkway_m: 0.5, row_gap_m: 0.1 }
    );
    expect(result.used_area_m2).toBe(result.count * 2);
  });
});

describe("selectInverter", () => {
  it("should select appropriate inverter for DC kWp", () => {
    const inverter = selectInverter(6, 1.2);
    expect(["INV_5K", "INV_8K", "INV_12K"]).toContain(inverter);
  });

  it("should prefer specified inverter if suitable", () => {
    const inverter = selectInverter(6, 1.2, "INV_8K");
    expect(inverter).toBe("INV_8K");
  });
});

describe("sizeStrings", () => {
  it("should size strings correctly", () => {
    const result = sizeStrings("MOD_550", "INV_5K", 20);
    expect(result.mppts.length).toBeGreaterThan(0);
    expect(result.mppts[0].strings.length).toBeGreaterThan(0);
  });
});

describe("buildBOM", () => {
  it("should build BOM with correct quantities", () => {
    const bom = buildBOM("MOD_550", "INV_5K", 20);
    expect(bom.modules.quantity).toBe(20);
    expect(bom.inverter.quantity).toBe(1);
  });
});