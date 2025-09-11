import type { DimensioningInput, DimensioningResult } from "./types";
import { calculateDimensioning } from "./calc";

export async function dimensionSystem(input: DimensioningInput): Promise<DimensioningResult> {
  // Tenta usar tools abstratas se disponível
  const apiUrl = process.env.DIMENSIONING_API_URL;
  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (response.ok) {
        const result = await response.json();
        // Valida com Zod se necessário
        return result;
      }
    } catch (error) {
      console.warn("Dimensioning API failed, using fallback:", error);
    }
  }

  // Fallback para cálculo local
  return calculateDimensioning(input);
}

// Tools abstratas (placeholders)
export async function roof_area_lookup(siteId: string): Promise<number> {
  // Simulação: em produção, chama API externa
  console.log(`Looking up roof area for site ${siteId}`);
  return 100; // m² placeholder
}

export async function inverter_catalog(): Promise<Record<string, unknown>> {
  // Simulação
  return {
    INV_5K: { ac_kw: 5, mppt_min: 120, mppt_max: 480, voc_max: 600, mppts: 2 },
    INV_8K: { ac_kw: 8, mppt_min: 200, mppt_max: 800, voc_max: 1000, mppts: 2 },
    INV_12K: { ac_kw: 12, mppt_min: 300, mppt_max: 850, voc_max: 1000, mppts: 3 },
  };
}

export async function module_catalog(): Promise<Record<string, unknown>> {
  // Simulação
  return {
    MOD_550: { wp: 550, length_m: 2.279, width_m: 1.134, area_m2: 2.58, Vmpp: 41.5, Voc: 50 },
    MOD_450: { wp: 450, length_m: 2, width_m: 1, area_m2: 2, Vmpp: 38, Voc: 46 },
  };
}

export async function string_calc(params: {
  Vmpp: number;
  Voc: number;
  mppt_min: number;
  mppt_max: number;
  voc_max: number;
  temp?: number;
}): Promise<{ modules_per_string: number }> {
  // Heurística simples
  const modules_per_string = Math.floor(params.mppt_max / params.Vmpp);
  return { modules_per_string };
}