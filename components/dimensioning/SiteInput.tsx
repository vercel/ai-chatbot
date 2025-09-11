"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { dimensionSystemAction } from "@/app/actions/dimensionSystemAction";
import type { DimensioningInput, DimensioningResult } from "@/lib/dimensioning/types";

const sectionSchema = z.object({
  id: z.string(),
  length_m: z.number().min(1),
  width_m: z.number().min(1),
  tilt_deg: z.number().min(0).max(45).optional(),
  azimuth: z.number().min(0).max(360).optional(),
  shading: z.number().min(0).max(0.2).default(0.05).optional(),
});

const inputSchema = z.object({
  persona: z.enum(["owner", "integrator"]).default("owner"),
  roof: z.object({
    total_area_m2: z.number().min(5).max(5000).optional(),
    sections: z.array(sectionSchema).optional()
  }).optional(),
  module: z.object({ preferred: z.enum(["MOD_550", "MOD_450"]).default("MOD_550").optional() }).optional(),
  inverter: z.object({
    preferred: z.enum(["INV_5K", "INV_8K", "INV_12K"]).optional(),
    target_dcac: z.number().min(1.05).max(1.5).default(1.2).optional()
  }).optional(),
  constraints: z.object({
    walkway_m: z.number().min(0).max(1).default(0.5).optional(),
    row_gap_m: z.number().min(0).max(0.5).default(0.1).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional()
  }).optional()
}).refine(d => !!(d.roof?.total_area_m2 || d.roof?.sections?.length), {
  message: "Informe área total ou ao menos uma seção."
});

type SiteInputProps = {
  readonly persona: "owner" | "integrator";
  readonly defaultValues?: Partial<DimensioningInput>;
  readonly onCalculated?: (result: DimensioningResult) => void;
  readonly submitMode?: "serverAction" | "api";
  readonly layout?: "compact" | "wide";
  readonly className?: string;
};

export function SiteInput({
  persona,
  defaultValues,
  onCalculated,
  submitMode = "serverAction",
  layout = "wide",
  className
}: SiteInputProps) {
  const [sections, setSections] = useState(defaultValues?.roof?.sections || []);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      persona,
      roof: { total_area_m2: defaultValues?.roof?.total_area_m2 },
      module: { preferred: defaultValues?.module?.preferred || "MOD_550" },
      inverter: { target_dcac: defaultValues?.inverter?.target_dcac || 1.2 },
      constraints: {
        walkway_m: defaultValues?.constraints?.walkway_m || 0.5,
        row_gap_m: defaultValues?.constraints?.row_gap_m || 0.1,
      },
      ...defaultValues
    }
  });

  const hasTotalArea = watch("roof.total_area_m2");
  const hasSections = sections.length > 0;

  const addSection = () => {
    const newSection = {
      id: `sec_${sections.length + 1}`,
      length_m: 10,
      width_m: 5,
      tilt_deg: 30,
      azimuth: 180,
      shading: 0.05
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: string, value: unknown) => {
    const updated = sections.map((sec, i) =>
      i === index ? { ...sec, [field]: value } : sec
    );
    setSections(updated);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    setErrors({});

    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (key === "roof" && sections.length > 0) {
        formData.append("roof.sections", JSON.stringify(sections));
      } else if (typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }

    try {
      let result: DimensioningResult;
      if (submitMode === "api") {
        const response = await fetch("/api/dimensioning/calc", {
          method: "POST",
          body: JSON.stringify({ ...data, roof: { ...data.roof, sections } }),
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("API error");
        result = await response.json();
      } else {
        const actionResult = await dimensionSystemAction(formData);
        if (!actionResult.success) {
          setErrors(actionResult.errors || {});
          return;
        }
        result = actionResult.data as DimensioningResult;
      }

      onCalculated?.(result);
    } catch (error) {
      console.error(error);
      setErrors({ general: ["Erro ao calcular dimensionamento"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <h2 className="text-2xl font-semibold mb-6">Configuração do Local</h2>

      {/* Área Total ou Seções */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Área útil total do telhado (m²)
          </label>
          <input
            type="number"
            {...register("roof.total_area_m2", { valueAsNumber: true })}
            className="w-full p-2 border rounded focus-yello"
            placeholder="Ex: 100"
            min="5"
            max="5000"
          />
          {errors["roof.total_area_m2"] && (
            <p className="text-red-500 text-sm mt-1">{errors["roof.total_area_m2"][0]}</p>
          )}
        </div>

        {persona === "integrator" && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Seções do telhado</label>
              <button
                type="button"
                onClick={addSection}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Adicionar Seção
              </button>
            </div>

            {sections.map((section, index) => (
              <div key={section.id} className="border p-4 mb-2 rounded">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Comprimento (m)"
                    value={section.length_m}
                    onChange={(e) => updateSection(index, "length_m", parseFloat(e.target.value))}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Largura (m)"
                    value={section.width_m}
                    onChange={(e) => updateSection(index, "width_m", parseFloat(e.target.value))}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Inclinação (°)"
                    value={section.tilt_deg}
                    onChange={(e) => updateSection(index, "tilt_deg", parseFloat(e.target.value))}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Azimute (°)"
                    value={section.azimuth}
                    onChange={(e) => updateSection(index, "azimuth", parseFloat(e.target.value))}
                    className="p-2 border rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferências */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Módulo preferido</label>
          <select {...register("module.preferred")} className="w-full p-2 border rounded focus-yello">
            <option value="MOD_550">MOD_550 (550 Wp)</option>
            <option value="MOD_450">MOD_450 (450 Wp)</option>
          </select>
        </div>

        {persona === "integrator" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Inversor preferido</label>
              <select {...register("inverter.preferred")} className="w-full p-2 border rounded focus-yello">
                <option value="">Automático</option>
                <option value="INV_5K">INV_5K (5 kW)</option>
                <option value="INV_8K">INV_8K (8 kW)</option>
                <option value="INV_12K">INV_12K (12 kW)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                DC/AC ratio alvo ({watch("inverter.target_dcac")})
              </label>
              <input
                type="range"
                min="1.05"
                max="1.5"
                step="0.05"
                {...register("inverter.target_dcac", { valueAsNumber: true })}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={loading || (!hasTotalArea && !hasSections)}
        className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded disabled:opacity-50 focus-yello"
      >
        {loading ? "Calculando..." : "Calcular Dimensionamento"}
      </button>

      {errors.general && (
        <p className="text-red-500 text-sm mt-2">{errors.general[0]}</p>
      )}
    </form>
  );
}