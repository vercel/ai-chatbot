import type { DimensioningInput, DimensioningResult } from "./types";

// Catálogo mínimo hardcoded
const MODULE_CATALOG = {
  MOD_550: { wp: 550, length_m: 2.279, width_m: 1.134, area_m2: 2.58, Vmpp: 41.5, Voc: 50 },
  MOD_450: { wp: 450, length_m: 2, width_m: 1, area_m2: 2, Vmpp: 38, Voc: 46 },
};

const INVERTER_CATALOG = {
  INV_5K: { ac_kw: 5, mppt_min: 120, mppt_max: 480, voc_max: 600, mppts: 2 },
  INV_8K: { ac_kw: 8, mppt_min: 200, mppt_max: 800, voc_max: 1000, mppts: 2 },
  INV_12K: { ac_kw: 12, mppt_min: 300, mppt_max: 850, voc_max: 1000, mppts: 3 },
};

export function packPanelsInSection(
  section: { length_m: number; width_m: number; shading?: number },
  moduleDims: { length_m: number; width_m: number; area_m2: number },
  constraints: { walkway_m: number; row_gap_m: number; orientation?: "portrait" | "landscape" }
): { rows: number; cols: number; count: number; used_area_m2: number; orientation: "portrait" | "landscape" } {
  const { length_m: L, width_m: W } = section;
  const { length_m: modL, width_m: modW, area_m2: modArea } = moduleDims;
  const { walkway_m, orientation } = constraints;

  const calcForOrientation = (isPortrait: boolean) => {
    const panelL = isPortrait ? modL : modW;
    const panelW = isPortrait ? modW : modL;
    const cols = Math.floor((L - 2 * walkway_m) / panelL);
    const rows = Math.floor((W - 2 * walkway_m) / panelW); // Simplified, ignoring row_gap for now
    const count = cols * rows;
    const used_area_m2 = count * modArea;
    return { rows, cols, count, used_area_m2 };
  };

  const portrait = calcForOrientation(true);
  const landscape = calcForOrientation(false);

  if (orientation) {
    return orientation === "portrait" ? { ...portrait, orientation: "portrait" } : { ...landscape, orientation: "landscape" };
  }

  // Escolhe o que dá mais painéis
  return portrait.count >= landscape.count
    ? { ...portrait, orientation: "portrait" }
    : { ...landscape, orientation: "landscape" };
}

export function selectInverter(dc_kwp: number, target_dcac: number, preferred?: string): string {
  const required_ac = dc_kwp / target_dcac;
  const candidates = Object.entries(INVERTER_CATALOG)
    .filter(([_, inv]) => inv.ac_kw >= required_ac)
    .sort(([_, a], [__, b]) => a.ac_kw - b.ac_kw);

  if (preferred && candidates.some(([k]) => k === preferred)) {
    return preferred;
  }

  return candidates[0]?.[0] || "INV_12K"; // fallback maior
}

export function sizeStrings(
  modKey: keyof typeof MODULE_CATALOG,
  invKey: keyof typeof INVERTER_CATALOG,
  total_panels: number
): { mppts: Array<{ mppt_id: number; strings: Array<{ modules: number; Vmpp_est: number; Voc_est: number }> }> } {
  const mod = MODULE_CATALOG[modKey];
  const inv = INVERTER_CATALOG[invKey];

  const modules_per_string = Math.floor(inv.mppt_max / mod.Vmpp);
  const strings_per_mppt = Math.ceil(total_panels / (modules_per_string * inv.mppts));

  const mppts = [];
  let remaining_panels = total_panels;

  for (let i = 0; i < inv.mppts; i++) {
    const strings = [];
    for (let j = 0; j < strings_per_mppt && remaining_panels > 0; j++) {
      const modules = Math.min(modules_per_string, remaining_panels);
      strings.push({
        modules,
        Vmpp_est: modules * mod.Vmpp,
        Voc_est: modules * mod.Voc * 1.15, // folga para frio
      });
      remaining_panels -= modules;
    }
    mppts.push({ mppt_id: i + 1, strings });
  }

  return { mppts };
}

export function buildBOM(
  modKey: keyof typeof MODULE_CATALOG,
  invKey: keyof typeof INVERTER_CATALOG,
  total_panels: number
): {
  modules: { model: string; quantity: number; wp: number };
  inverter: { model: string; quantity: number; ac_kw: number };
  dc_protections: string[];
  ac_protections: string[];
} {
  const mod = MODULE_CATALOG[modKey];
  const inv = INVERTER_CATALOG[invKey];

  return {
    modules: { model: modKey, quantity: total_panels, wp: mod.wp },
    inverter: { model: invKey, quantity: 1, ac_kw: inv.ac_kw },
    dc_protections: [`Fusível DC ${total_panels}A`, "Disjuntor DC"],
    ac_protections: ["Disjuntor AC", "Relé de proteção"],
  };
}

export function calculateDimensioning(input: DimensioningInput): DimensioningResult {
  const modKey = input.module?.preferred || "MOD_550";
  const target_dcac = input.inverter?.target_dcac || 1.2;
  const constraints = {
    walkway_m: input.constraints?.walkway_m || 0.5,
    row_gap_m: input.constraints?.row_gap_m || 0.1,
    orientation: input.constraints?.orientation,
  };

  let total_panels = 0;
  let total_used_area = 0;
  const sections = [];

  if (input.roof?.sections) {
    for (const sec of input.roof.sections) {
      const packing = packPanelsInSection(sec, MODULE_CATALOG[modKey], constraints);
      const shaded_count = Math.floor(packing.count * (1 - (sec.shading || 0.05)));
      total_panels += shaded_count;
      total_used_area += packing.used_area_m2;
      sections.push({
        id: sec.id,
        orientation: packing.orientation,
        panels_count: shaded_count,
        panels_rows: packing.rows,
        panels_cols: packing.cols,
        used_area_m2: packing.used_area_m2,
        density_wp_m2: (shaded_count * MODULE_CATALOG[modKey].wp) / packing.used_area_m2,
      });
    }
  } else if (input.roof?.total_area_m2) {
    // Simulação simples para área total
    const area_per_panel = MODULE_CATALOG[modKey].area_m2;
    total_panels = Math.floor(input.roof.total_area_m2 / area_per_panel);
    total_used_area = total_panels * area_per_panel;
    sections.push({
      id: "total",
      orientation: "portrait",
      panels_count: total_panels,
      panels_rows: Math.floor(Math.sqrt(total_panels)),
      panels_cols: Math.ceil(total_panels / Math.floor(Math.sqrt(total_panels))),
      used_area_m2: total_used_area,
      density_wp_m2: (total_panels * MODULE_CATALOG[modKey].wp) / total_used_area,
    });
  }

  const dc_kwp = (total_panels * MODULE_CATALOG[modKey].wp) / 1000;
  const invKey = selectInverter(dc_kwp, target_dcac, input.inverter?.preferred) as keyof typeof INVERTER_CATALOG;
  const ac_kw = INVERTER_CATALOG[invKey].ac_kw;
  const dcac_ratio = dc_kwp / ac_kw;

  const strings = sizeStrings(modKey, invKey, total_panels);
  const bom = buildBOM(modKey, invKey, total_panels);

  const notes = [];
  if (dcac_ratio > 1.3) notes.push("DC/AC ratio alto; considere oversizing do inversor.");
  if (total_panels < 10) notes.push("Sistema pequeno; verifique viabilidade econômica.");

  return {
    stage: "dimensioning",
    inputs: input,
    selection: { module: modKey, inverter: invKey, dc_kwp, ac_kw, dcac_ratio },
    layout: { total_sections: sections.length, sections },
    strings,
    bom,
    notes,
    summary: {
      headline: `Sistema de ${dc_kwp.toFixed(1)} kWp com ${total_panels} painéis`,
      bullets: [
        `${ac_kw} kW de inversor ${invKey}`,
        `${sections.length} seção(ões) com densidade média ${(total_panels * MODULE_CATALOG[modKey].wp / total_used_area).toFixed(0)} Wp/m²`,
        `DC/AC ratio: ${dcac_ratio.toFixed(2)}`,
      ],
    },
  };
}