import React, { useState } from 'react';
import { z } from 'zod';
import TechnicalFeasibilityCard, {
  technicalFeasibilitySchema,
  type TechnicalFeasibilityData,
} from '@/packages/ui-cards/TechnicalFeasibilityCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Schema-driven form uses same schema as TechnicalFeasibilityCard
const formSchema = technicalFeasibilitySchema;

export const ConstraintsEditor: React.FC = () => {
  const [formData, setFormData] = useState<TechnicalFeasibilityData>({
    roof_suitability: '',
    site_constraints: [],
    utility_rules: [],
    viability_score: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<TechnicalFeasibilityData | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'viability_score' ? Number(value) : value,
    }));
  };

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const items = value
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
    setFormData((prev) => ({
      ...prev,
      [name]: items,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = formSchema.parse(formData);
      setSaved(parsed);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const field = issue.path[0] as string;
          fieldErrors[field] = issue.message;
        }
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="roof_suitability">
            Adequação do Telhado
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  id="roof_suitability"
                  name="roof_suitability"
                  type="text"
                  className="w-full border rounded p-2"
                  placeholder="Ex: metálico, cerâmico"
                  value={formData.roof_suitability}
                  onChange={handleChange}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                Conforme NBR 6120 para cargas permanentes.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {errors.roof_suitability && (
            <p className="text-xs text-red-600">{errors.roof_suitability}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="site_constraints">
            Restrições Estruturais
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <textarea
                  id="site_constraints"
                  name="site_constraints"
                  className="w-full border rounded p-2"
                  placeholder="Separe por vírgulas"
                  value={formData.site_constraints.join(', ')}
                  onChange={handleArrayChange}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                Normas de referência: NBR 6123 e NBR 8681.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {errors.site_constraints && (
            <p className="text-xs text-red-600">{errors.site_constraints}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="utility_rules">
            Regras da Utilidade
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <textarea
                  id="utility_rules"
                  name="utility_rules"
                  className="w-full border rounded p-2"
                  placeholder="Separe por vírgulas"
                  value={formData.utility_rules.join(', ')}
                  onChange={handleArrayChange}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                Conforme NR-10 para instalações elétricas.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {errors.utility_rules && (
            <p className="text-xs text-red-600">{errors.utility_rules}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="viability_score">
            Score de Viabilidade
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  id="viability_score"
                  name="viability_score"
                  type="number"
                  min={0}
                  max={100}
                  className="w-full border rounded p-2"
                  value={formData.viability_score}
                  onChange={handleChange}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                Valor entre 0 e 100 conforme critérios técnicos.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {errors.viability_score && (
            <p className="text-xs text-red-600">{errors.viability_score}</p>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Salvar
        </button>
      </form>

      {saved && <TechnicalFeasibilityCard {...saved} />}
    </div>
  );
};

export default ConstraintsEditor;

