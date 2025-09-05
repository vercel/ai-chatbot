'use client';
import { useState } from 'react';
import { Card } from '@/apps/web/components/canvas/Card';

interface ChecklistItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  reference: string;
  done: boolean;
}

const defaultItems: ChecklistItem[] = [
  {
    id: 'ren482',
    title: 'Net metering compliance',
    severity: 'high',
    reference: 'ANEEL REN 482/2012',
    done: false,
  },
  {
    id: 'prod3',
    title: 'Grid connection standards',
    severity: 'medium',
    reference: 'PRODIST Module 3',
    done: false,
  },
  {
    id: 'nr10',
    title: 'Electrical safety (NR-10)',
    severity: 'low',
    reference: 'NR-10',
    done: false,
  },
];

interface ComplianceChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}

export function ComplianceChecklist({ items, onToggle }: ComplianceChecklistProps) {
  const severityStyles: Record<ChecklistItem['severity'], string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <input
            id={item.id}
            type="checkbox"
            checked={item.done}
            onChange={() => onToggle(item.id)}
          />
          <div className="flex flex-col">
            <label htmlFor={item.id} className="font-medium">
              {item.title}
            </label>
            <div className="text-xs text-gray-500">
              <span className={severityStyles[item.severity]}>{item.severity}</span>
              {' '}·{' '}
              <span>{item.reference}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ComplianceCard() {
  const [items, setItems] = useState<ChecklistItem[]>(defaultItems);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  const handleExport = (format: string) => {
    if (format !== 'json') return;
    const data = items.map((item) => ({
      id: item.id,
      title: item.title,
      severity: item.severity,
      reference: item.reference,
      done: item.done,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compliance-checklist.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const completed = items.filter((i) => i.done).length;

  return (
    <Card
      id="compliance"
      title={`Compliance (${completed}/${items.length})`}
      onExport={handleExport}
    >
      <ComplianceChecklist items={items} onToggle={toggle} />
    </Card>
  );
}

