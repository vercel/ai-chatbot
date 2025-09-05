"use client";

export function GuidedWizardOverlay() {
  return (
    <div role="dialog" aria-modal="true" aria-label="Guided Wizard" className="p-4 border rounded-md">
      Guided Wizard Overlay
    </div>
  );
}

export function SavingsSlider() {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="savings">Savings</label>
      <input id="savings" type="range" min={0} max={100} />
    </div>
  );
}

export function GoalPicker() {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="goal">Goal</label>
      <select id="goal" className="border p-1 rounded">
        <option>Retirement</option>
        <option>Education</option>
      </select>
    </div>
  );
}

export function FinancingPicker() {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="financing">Financing</label>
      <select id="financing" className="border p-1 rounded">
        <option>Cash</option>
        <option>Loan</option>
      </select>
    </div>
  );
}

export function AppointmentScheduler() {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="appointment">Appointment Date</label>
      <input id="appointment" type="date" className="border p-1 rounded" />
    </div>
  );
}

export function ConsentManager() {
  return (
    <div className="flex items-center gap-2">
      <input id="consent" type="checkbox" />
      <label htmlFor="consent">I agree to the terms</label>
    </div>
  );
}
