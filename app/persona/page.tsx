"use client";

import { PersonaSwitcher } from "@/components/persona-switcher";
import { FeatureGate } from "@/components/feature-gate";
import {
  GuidedWizardOverlay,
  SavingsSlider,
  GoalPicker,
  FinancingPicker,
  AppointmentScheduler,
  ConsentManager,
} from "@/components/persona/owner";
import {
  SpecLibrary,
  LayoutOptimizerPanel,
  ConstraintsEditor,
  TariffSelector,
  PricingRules,
  ComplianceChecklist,
  DataSourceSelector,
  BatchRunner,
} from "@/components/persona/integrator";
import { usePersona } from "@/lib/persona/context";
import { NextCTA } from "@/components/ui/NextCTA";

export default function PersonaPage() {
  const { mode } = usePersona();
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Selecione seu perfil</h1>
      <p className="text-sm text-muted-foreground">
        Escolha a opção que melhor representa você.
      </p>
      <PersonaSwitcher />
      {mode === "owner" ? (
        <div className="space-y-3">
          <FeatureGate permission="owner">
            <GuidedWizardOverlay />
          </FeatureGate>
          <FeatureGate permission="owner">
            <SavingsSlider />
          </FeatureGate>
          <FeatureGate permission="owner">
            <GoalPicker />
          </FeatureGate>
          <FeatureGate permission="owner">
            <FinancingPicker />
          </FeatureGate>
          <FeatureGate permission="owner">
            <AppointmentScheduler />
          </FeatureGate>
          <FeatureGate permission="owner">
            <ConsentManager />
          </FeatureGate>
        </div>
      ) : (
        <div className="space-y-3">
          <FeatureGate permission="integrator">
            <SpecLibrary />
          </FeatureGate>
          <FeatureGate permission="integrator">
            <LayoutOptimizerPanel />
          </FeatureGate>
          <FeatureGate permission="integrator">
            <ConstraintsEditor />
          </FeatureGate>
          <FeatureGate permission="integrator">
            <TariffSelector />
          </FeatureGate>
          <FeatureGate permission="integrator">
            <PricingRules />
          </FeatureGate>
          <FeatureGate permission="integrator">
            <ComplianceChecklist />
          </FeatureGate>
          <FeatureGate permission="integrator">
            <DataSourceSelector />
          </FeatureGate>
          <FeatureGate permission="integrator" flag="batch">
            <BatchRunner />
          </FeatureGate>
        </div>
      )}
      <NextCTA primary={{ label: "Continuar", href: "/journey" }} />
    </main>
  );
}
