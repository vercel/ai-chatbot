import type { ReactNode } from 'react';
import { useState } from 'react';
import { CardToolbar } from './CardToolbar';

interface CardProps {
  id: string;
  title: string;
  tags?: string[];
  avatarUrl?: string;
  timestamp?: Date;
  onPin?: () => void;
  onCompare?: () => void;
  onExport?: (format: string) => void;
  onRun?: () => void;
  children?: ReactNode;
}

export function Card({
  id,
  title,
  tags = [],
  avatarUrl,
  timestamp,
  onPin,
  onCompare,
  onExport,
  onRun,
  children,
}: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id={id} className="border rounded bg-white shadow-md w-80">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full" />
          ) : null}
          <div className="flex flex-col">
            <span className="font-medium">{title}</span>
            {tags.length > 0 && (
              <span className="text-xs text-gray-500">{tags.join(', ')}</span>
            )}
          </div>
        </div>
        <div className="relative flex items-center gap-1">
          {timestamp && (
            <span className="text-xs text-gray-400">
              {timestamp.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="menu"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded shadow-md z-10">
              <button
                type="button"
                className="block px-2 py-1 w-full text-left"
                onClick={onPin}
              >
                Pin
              </button>
              <button
                type="button"
                className="block px-2 py-1 w-full text-left"
                onClick={onCompare}
              >
                Compare
              </button>
              <button
                type="button"
                className="block px-2 py-1 w-full text-left"
                onClick={() => onExport?.('json')}
              >
                Export
              </button>
              <button
                type="button"
                className="block px-2 py-1 w-full text-left"
                onClick={onRun}
              >
                Run
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-2">{children}</div>
      <CardToolbar
        onRecalculate={onRun}
        onDuplicate={() => {}}
        onExport={onExport}
      />
    </div>
  );
}
