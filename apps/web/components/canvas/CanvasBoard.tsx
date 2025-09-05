import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { localStorageProvider, type StorageProvider } from '@/apps/web/lib/canvas/storage';

interface Position {
  x: number;
  y: number;
}

interface CanvasBoardProps {
  children: ReactNode | ReactNode[];
  storageKey?: string;
  storage?: StorageProvider;
}

export function CanvasBoard({
  children,
  storageKey = 'canvas-layout',
  storage = localStorageProvider,
}: CanvasBoardProps) {
  const [layout, setLayout] = useState<Record<string, Position>>({});
  const [scale, setScale] = useState(1);
  const draggingId = useRef<string | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const saved = storage.getItem<Record<string, Position>>(storageKey);
    if (saved) setLayout(saved);
  }, [storage, storageKey]);

  useEffect(() => {
    storage.setItem(storageKey, layout);
  }, [layout, storage, storageKey]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setScale((s) => {
      const next = s - e.deltaY * 0.001;
      return Math.min(Math.max(next, 0.5), 2);
    });
  };

  const onPointerDown = (id: string, e: React.PointerEvent) => {
    draggingId.current = id;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const id = draggingId.current;
    if (!id) return;
    const delta = {
      x: e.clientX - lastPos.current.x,
      y: e.clientY - lastPos.current.y,
    };
    lastPos.current = { x: e.clientX, y: e.clientY };
    setLayout((l) => {
      const prev = l[id] ?? { x: 0, y: 0 };
      return { ...l, [id]: { x: prev.x + delta.x, y: prev.y + delta.y } };
    });
  };

  const onPointerUp = () => {
    const id = draggingId.current;
    if (!id) return;
    draggingId.current = null;
    setLayout((l) => {
      const pos = l[id];
      const snapped = {
        x: Math.round(pos.x / 20) * 20,
        y: Math.round(pos.y / 20) * 20,
      };
      return { ...l, [id]: snapped };
    });
  };

  const nodes = Array.isArray(children) ? children : [children];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onWheel={handleWheel}
      style={{
        backgroundSize: `${20 * scale}px ${20 * scale}px`,
        backgroundImage:
          'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)',
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      }}
    >
      {nodes.map((child: any) => {
        const id = child.props.id;
        const pos = layout[id] ?? { x: 0, y: 0 };
        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              transform: `translate(${pos.x}px, ${pos.y}px)`,
            }}
            onPointerDown={(e) => onPointerDown(id, e)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
