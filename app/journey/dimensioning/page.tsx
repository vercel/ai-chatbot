"use client";

import { useState } from "react";
import { SiteInput } from "../../../components/dimensioning/SiteInput";
import { DimensioningSpec } from "../../../components/dimensioning/DimensioningSpec";
import type { DimensioningResult } from "@/lib/dimensioning/types";

export default function DimensioningPage() {
  const [result, setResult] = useState<DimensioningResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculated = (calcResult: DimensioningResult) => {
    setResult(calcResult);
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 yello-gradient-text">
          Dimensionamento do Sistema FV
        </h1>

        <div className="space-y-8">
          <SiteInput
            persona="owner" // ou "integrator" baseado no contexto
            onCalculated={handleCalculated}
            submitMode="serverAction"
            layout="wide"
            className="glass yello-stroke p-6"
          />

          {loading && (
            <output className="glass yello-stroke p-6 text-center" aria-live="polite">
              Calculando dimensionamento...
            </output>
          )}

          {result && !loading && (
            <DimensioningSpec
              result={result}
              className="glass yello-stroke p-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}