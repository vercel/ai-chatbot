"use client";

export { SpecLibrary } from '@/apps/web/components/personas/integrator/SpecLibrary';

export { LayoutOptimizerPanel } from "@/apps/web/components/personas/integrator/LayoutOptimizerPanel";

export function ConstraintsEditor() {
  return <div className="p-2 border rounded">Constraints Editor</div>;
}

export { TariffSelector } from "@/apps/web/components/personas/integrator/TariffSelector";

export function PricingRules() {
  return <div className="p-2 border rounded">Pricing Rules</div>;
}

export function ComplianceChecklist() {
  return <div className="p-2 border rounded">Compliance Checklist</div>;
}

export function DataSourceSelector() {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="data-source">Data Source</label>
      <select id="data-source" className="border p-1 rounded">
        <option>API</option>
        <option>CSV</option>
      </select>
    </div>
  );
}

export function BatchRunner() {
  return (
    <button type="button" className="border p-2 rounded">
      Run Batch
    </button>
  );
}
