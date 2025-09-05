"use client";

import { useMemo, useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { z } from "zod";
import { computeIndicators } from "@/packages/ui-cards/FinancialAnalysisCard";

type GoalType = "percent" | "currency" | "energy";

const goalSchema = z.object({
  type: z.enum(["percent", "currency", "energy"]),
  value: z.number().nonnegative(),
  objective: z.string().min(1),
});

export function SavingsSliderGoalPicker() {
  const [goal, setGoal] = useState({
    type: "percent" as GoalType,
    value: 10,
    objective: "Retirement",
  });

  const parsed = useMemo(() => {
    try {
      return goalSchema.parse(goal);
    } catch {
      return null;
    }
  }, [goal]);

  const indicators = useMemo(() => {
    if (!parsed) return null;
    // tie with financial analysis by using goal value as tariff placeholder
    return computeIndicators({ tariff: parsed.value, losses: 0.1, years: 5 });
  }, [parsed]);

  const max = goal.type === "percent" ? 100 : 10000;
  const unitLabel = goal.type === "percent" ? "%" : goal.type === "currency" ? "R$" : "kWh";

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex flex-col gap-2">
        <span id="goal-type-label" className="font-medium">
          Tipo de meta
        </span>
        <div role="radiogroup" aria-labelledby="goal-type-label" className="flex gap-4">
          {(["percent", "currency", "energy"] as GoalType[]).map((t) => (
            <Tooltip.Provider key={t} delayDuration={300}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="goalType"
                      value={t}
                      checked={goal.type === t}
                      onChange={() => setGoal({ ...goal, type: t })}
                    />
                    {t === "percent" ? "%" : t === "currency" ? "R$" : "kWh"}
                  </label>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" className="rounded bg-gray-800 px-2 py-1 text-xs text-white">
                  {t === "percent"
                    ? "Economia em porcentagem"
                    : t === "currency"
                      ? "Economia em reais"
                      : "Economia em energia"}
                  <Tooltip.Arrow className="fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="goal-value" className="font-medium">
          Valor da meta ({unitLabel})
        </label>
        <input
          id="goal-value"
          type="range"
          min={0}
          max={max}
          value={goal.value}
          onChange={(e) => setGoal({ ...goal, value: Number(e.target.value) })}
          className="w-full"
        />
        <span>{`${goal.value} ${unitLabel}`}</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="objective" className="font-medium">
          Objetivo
        </label>
        <select
          id="objective"
          value={goal.objective}
          onChange={(e) => setGoal({ ...goal, objective: e.target.value })}
          className="rounded border p-1"
        >
          <option value="Retirement">Aposentadoria</option>
          <option value="Education">Educação</option>
          <option value="Travel">Viagem</option>
        </select>
      </div>

      {parsed ? (
        indicators && (
          <div className="text-sm">
            Projeção ROI: {indicators.roi.toFixed(2)}%
          </div>
        )
      ) : (
        <div className="text-sm text-red-600" role="alert">
          Valores inválidos
        </div>
      )}
    </div>
  );
}

export default SavingsSliderGoalPicker;

