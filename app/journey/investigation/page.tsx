"use client";

import { useState } from "react";
import ProgressiveLeadForm from "@/components/intent/ProgressiveLeadForm";
import LeadValidationCard from "@/components/lead/LeadValidationCard";
import type { LeadValidationResult } from "@/lib/lead/types";

export default function InvestigationPage() {
  const [validationResult, setValidationResult] =
    useState<LeadValidationResult | null>(null);

  const handleIntentValidated = (result: LeadValidationResult) => {
    setValidationResult(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Investigação Inicial
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Vamos começar entendendo suas necessidades e validando suas
              informações
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progressive Lead Form */}
            <div>
              <ProgressiveLeadForm onValidated={handleIntentValidated} />
            </div>

            {/* Validation Result */}
            <div>
              {validationResult && (
                <LeadValidationCard result={validationResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
