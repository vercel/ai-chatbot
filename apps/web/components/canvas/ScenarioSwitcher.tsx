import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { nanoid } from 'nanoid';

interface Scenario {
  id: string;
  label: string;
  color: string;
}

interface ScenarioSwitcherProps {
  onCreate?: (scenario: Scenario) => void;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STORAGE_KEY = 'scenario-switcher';
const COLORS = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];

export function ScenarioSwitcher({ onCreate, onSelect, onDelete }: ScenarioSwitcherProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentId, setCurrentId] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { scenarios: Scenario[]; currentId: string };
      setScenarios(parsed.scenarios);
      setCurrentId(parsed.currentId);
    } else {
      const first: Scenario = { id: nanoid(), label: 'Scenario A', color: COLORS[0] };
      setScenarios([first]);
      setCurrentId(first.id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ scenarios, currentId })
    );
  }, [scenarios, currentId]);

  useEffect(() => {
    if (currentId) onSelect?.(currentId);
  }, [currentId, onSelect]);

  const addScenario = () => {
    const nextIndex = scenarios.length;
    const scenario: Scenario = {
      id: nanoid(),
      label: `Scenario ${String.fromCharCode(65 + nextIndex)}`,
      color: COLORS[nextIndex % COLORS.length],
    };
    setScenarios([...scenarios, scenario]);
    setCurrentId(scenario.id);
    onCreate?.(scenario);
  };

  const renameScenario = (id: string, label: string) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  };

  const removeScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id && scenarios.length > 1) {
      const next = scenarios.find((s) => s.id !== id);
      if (next) setCurrentId(next.id);
    }
    onDelete?.(id);
  };

  return (
    <div className="flex items-center gap-2">
      {scenarios.map((sc) => (
        <div
          key={sc.id}
          role="button"
          aria-label={sc.label}
          onClick={() => setCurrentId(sc.id)}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded cursor-pointer',
            currentId === sc.id ? 'ring-2 ring-offset-2' : 'opacity-70'
          )}
          style={{ backgroundColor: sc.color }}
        >
          <input
            className="bg-transparent border-none text-white w-20 text-xs focus:outline-none"
            value={sc.label}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => renameScenario(sc.id, e.target.value)}
          />
          <button
            type="button"
            aria-label={`Delete ${sc.label}`}
            onClick={(e) => {
              e.stopPropagation();
              removeScenario(sc.id);
            }}
            className="text-white text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        aria-label="Add scenario"
        onClick={addScenario}
        className="px-2 py-1 border rounded"
      >
        +
      </button>
    </div>
  );
}

export type { Scenario };
