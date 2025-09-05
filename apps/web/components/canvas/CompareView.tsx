import type { ReactNode } from 'react';

interface CompareViewProps {
  left: ReactNode;
  right: ReactNode;
}

export function CompareView({ left, right }: CompareViewProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border rounded overflow-auto">{left}</div>
      <div className="border rounded overflow-auto">{right}</div>
    </div>
  );
}
