'use client';

import { useEffect, useState } from 'react';
import equal from 'fast-deep-equal';
import { trace } from '@opentelemetry/api';

export interface Version {
  id: string;
  timestamp: string | number | Date;
  author: string;
  note?: string;
  data: Record<string, unknown>;
}

interface VersionTimelineProps {
  versions: Version[];
  current?: string;
  onRestore?: (v: Version) => void;
  onBranch?: (v: Version) => void;
}

function diffObjects(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changes: Array<{ key: string; before: unknown; after: unknown }> = [];
  keys.forEach((k) => {
    if (!equal(prev[k], next[k])) {
      changes.push({ key: k, before: prev[k], after: next[k] });
    }
  });
  return changes;
}

export function VersionTimeline({
  versions,
  current,
  onRestore,
  onBranch,
}: VersionTimelineProps) {
  const [index, setIndex] = useState(() =>
    Math.max(0, versions.findIndex((v) => v.id === current)),
  );

  useEffect(() => {
    const idx = versions.findIndex((v) => v.id === current);
    if (idx !== -1) setIndex(idx);
  }, [current, versions]);

  const restore = (i: number) => {
    const version = versions[i];
    if (!version) return;
    const span = trace.getTracer('card').startSpan('card.version.rollback');
    try {
      setIndex(i);
      onRestore?.(version);
    } finally {
      span.end();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (index + 1 < versions.length) restore(index + 1);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (index - 1 >= 0) restore(index - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, versions]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, versions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      restore(index);
    }
  };

  return (
    <ol
      className="p-2 space-y-2 text-sm"
      role="listbox"
      tabIndex={0}
      aria-activedescendant={versions[index]?.id}
      onKeyDown={onKeyDown}
    >
      {versions.map((v, i) => {
        const prev = versions[i + 1];
        const delta = diffObjects(prev?.data ?? {}, v.data ?? {});
        return (
          <li
            key={v.id}
            id={v.id}
            data-testid={`version-${i}`}
            role="option"
            aria-selected={i === index}
            className={`border p-2 rounded ${
              i === index ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{v.note ?? v.id}</div>
                <div className="text-xs text-gray-500">
                  {new Date(v.timestamp).toLocaleString()} – {v.author}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="underline"
                  onClick={() => restore(i)}
                >
                  Rollback
                </button>
                <button
                  type="button"
                  className="underline"
                  onClick={() => onBranch?.(v)}
                >
                  Branch
                </button>
              </div>
            </div>
            {delta.length > 0 && (
              <div className="mt-1">
                {delta.map((d) => (
                  <div key={d.key} className="whitespace-pre-wrap">
                    <span>{d.key}: </span>
                    <span className="text-red-600 line-through">
                      {JSON.stringify(d.before)}
                    </span>
                    <span> → </span>
                    <span className="text-green-600">
                      {JSON.stringify(d.after)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

