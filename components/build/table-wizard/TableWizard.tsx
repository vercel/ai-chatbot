"use client";

import { useState, useCallback } from "react";
import type { WizardState } from "@/lib/build/table-wizard/types";
import { WizardStepIndicator } from "./WizardStepIndicator";
import { WizardNavigation } from "./WizardNavigation";
import { TablePreview } from "./TablePreview";
import { Step1TableType } from "./steps/Step1TableType";
import { Step2BasicInfo } from "./steps/Step2BasicInfo";
import { Step3Fields } from "./steps/Step3Fields";
import { Step4Relationships } from "./steps/Step4Relationships";
import { Step5Policies } from "./steps/Step5Policies";
import { Step6Review } from "./steps/Step6Review";
import { TOTAL_STEPS } from "@/lib/build/table-wizard/types";

const initialWizardState: WizardState = {
  currentStep: 1,
  tableType: null,
  baseTableId: null,
  id: "",
  name: "",
  description: "",
  fields: [],
  relationships: [],
  policyGroup: null,
  autoGeneratePages: true,
  validationErrors: {},
};

export function TableWizard() {
  const [state, setState] = useState<WizardState>(initialWizardState);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  }, []);

  const renderStep = () => {
    const stepProps = {
      state,
      updateState,
      goToStep,
    };

    switch (state.currentStep) {
      case 1:
        return <Step1TableType {...stepProps} />;
      case 2:
        return <Step2BasicInfo {...stepProps} />;
      case 3:
        return <Step3Fields {...stepProps} />;
      case 4:
        return <Step4Relationships {...stepProps} />;
      case 5:
        return <Step5Policies {...stepProps} />;
      case 6:
        return <Step6Review {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel - Configuration */}
      <div className="flex flex-col w-1/2 border-r border-border overflow-hidden">
        {/* Header with step indicator */}
        <div className="border-b border-border p-6 bg-background">
          <WizardStepIndicator
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
          />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>

        {/* Navigation footer */}
        <div className="border-t border-border p-6 bg-background">
          <WizardNavigation
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            state={state}
            goToStep={goToStep}
          />
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <TablePreview state={state} />
      </div>
    </div>
  );
}

