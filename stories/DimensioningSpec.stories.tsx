import type { Meta, StoryObj } from "@storybook/react";
import { DimensioningSpec } from "../components/dimensioning/DimensioningSpec";
import type { DimensioningResult } from "../lib/dimensioning/types";

const mockResult: DimensioningResult = {
  stage: "dimensioning",
  inputs: {
    persona: "owner",
    roof: { total_area_m2: 100 },
    module: { preferred: "MOD_550" },
  },
  selection: {
    module: "MOD_550",
    inverter: "INV_8K",
    dc_kwp: 11,
    ac_kw: 8,
    dcac_ratio: 1.375,
  },
  layout: {
    total_sections: 1,
    sections: [
      {
        id: "total",
        orientation: "portrait",
        panels_count: 20,
        panels_rows: 4,
        panels_cols: 5,
        used_area_m2: 40,
        density_wp_m2: 275,
      },
    ],
  },
  strings: {
    mppts: [
      {
        mppt_id: 1,
        strings: [
          { modules: 10, Vmpp_est: 551, Voc_est: 600 },
        ],
      },
      {
        mppt_id: 2,
        strings: [
          { modules: 10, Vmpp_est: 551, Voc_est: 600 },
        ],
      },
    ],
  },
  bom: {
    modules: { model: "MOD_550", quantity: 20, wp: 550 },
    inverter: { model: "INV_8K", quantity: 1, ac_kw: 8 },
    dc_protections: ["Fusível DC 20A", "Disjuntor DC"],
    ac_protections: ["Disjuntor AC", "Relé de proteção"],
  },
  notes: ["DC/AC ratio alto; considere oversizing do inversor."],
  summary: {
    headline: "Sistema de 11.0 kWp com 20 painéis",
    bullets: [
      "8 kW de inversor INV_8K",
      "1 seção(ões) com densidade média 275 Wp/m²",
      "DC/AC ratio: 1.38",
    ],
  },
};

const meta: Meta<typeof DimensioningSpec> = {
  title: "Dimensioning/DimensioningSpec",
  component: DimensioningSpec,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof DimensioningSpec>;

export const Default: Story = {
  args: {
    result: mockResult,
  },
};

export const WithMultipleSections: Story = {
  args: {
    result: {
      ...mockResult,
      layout: {
        total_sections: 2,
        sections: [
          {
            id: "sec1",
            orientation: "portrait",
            panels_count: 10,
            panels_rows: 2,
            panels_cols: 5,
            used_area_m2: 20,
            density_wp_m2: 275,
          },
          {
            id: "sec2",
            orientation: "landscape",
            panels_count: 10,
            panels_rows: 5,
            panels_cols: 2,
            used_area_m2: 20,
            density_wp_m2: 275,
          },
        ],
      },
    },
  },
};