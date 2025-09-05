"use client";

export { SpecLibrary } from '@/apps/web/components/personas/integrator/SpecLibrary';

export function LayoutOptimizerPanel() {
  return <div className="p-2 border rounded">Layout Optimizer Panel</div>;
}

export function ConstraintsEditor() {
  return <div className="p-2 border rounded">Constraints Editor</div>;
}

export function TariffSelector() {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="tariff">Tariff</label>
      <select id="tariff" className="border p-1 rounded">
        <option>Residential</option>
        <option>Commercial</option>
      </select>
    </div>
  );
}

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
