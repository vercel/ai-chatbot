import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

interface AnnotateProps {
  imageSrc: string;
  onExport?: (dataUrl: string) => void;
}

export function Annotate({ imageSrc, onExport }: AnnotateProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState<Annotation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const anno: Annotation = {
      id: `${Date.now()}`,
      x,
      y,
      width: 0,
      height: 0,
      text: '',
    };
    setCurrent(anno);
    setDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || !current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = e.clientX - rect.left - current.x;
    const height = e.clientY - rect.top - current.y;
    setCurrent({ ...current, width, height });
  };

  const handlePointerUp = () => {
    if (!current) return;
    const width = Math.abs(current.width);
    const height = Math.abs(current.height);
    const x = current.width < 0 ? current.x + current.width : current.x;
    const y = current.height < 0 ? current.y + current.height : current.y;
    const final = {
      ...current,
      x,
      y,
      width: width || 10,
      height: height || 10,
    };
    setAnnotations((prev) => [...prev, final]);
    setCurrent(null);
    setDrawing(false);
  };

  const handleTextChange = (id: string, text: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text } : a)),
    );
  };

  const exportPng = async () => {
    if (!containerRef.current) return;
    const dataUrl = await toPng(containerRef.current);
    onExport?.(dataUrl);
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="relative inline-block"
        aria-label="Image annotation canvas"
      >
        <img src={imageSrc} alt="" />
        <div
          className="absolute inset-0"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="presentation"
        >
          {annotations.map((a) => (
            <div
              key={a.id}
              className="absolute border border-blue-500 bg-blue-200/20"
              style={{
                left: a.x,
                top: a.y,
                width: a.width,
                height: a.height,
              }}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleTextChange(a.id, e.currentTarget.innerHTML)
                }
                className="bg-white text-xs p-1 outline-none"
                aria-label="Annotation text"
              >
                {a.text}
              </div>
            </div>
          ))}
          {current && (
            <div
              className="absolute border border-blue-500 border-dashed"
              style={{
                left: current.x,
                top: current.y,
                width: current.width,
                height: current.height,
              }}
            />
          )}
        </div>
      </div>
      <button
        type="button"
        className="mt-2 px-3 py-1 border rounded"
        onClick={exportPng}
        aria-label="Export annotations as PNG"
      >
        Export PNG
      </button>
    </div>
  );
}

export default Annotate;
