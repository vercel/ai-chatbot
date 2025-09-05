import { useCallback, useRef, useState } from 'react';
import Annotation from 'react-image-annotation';
import { toast } from 'sonner';

const MAX_FILE_SIZE_MB = 5;

interface RoofPhotoAttachProps {
  onExport?: (dataUrl: string) => void;
}

export function RoofPhotoAttach({ onExport }: RoofPhotoAttachProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [annotation, setAnnotation] = useState<any>({});

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Formato de arquivo inválido.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Arquivo deve ser menor que ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    },
    [],
  );

  const exportImage = useCallback(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      annotations.forEach((ann) => {
        const { x, y, width, height } = ann.geometry;
        ctx.strokeRect(
          (x / 100) * img.width,
          (y / 100) * img.height,
          (width / 100) * img.width,
          (height / 100) * img.height,
        );
      });
      const dataUrl = canvas.toDataURL('image/png');
      onExport?.(dataUrl);
    };
  }, [annotations, imageUrl, onExport]);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-1 border rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          Anexar foto
        </button>
        {imageUrl && (
          <button
            type="button"
            className="px-3 py-1 border rounded"
            onClick={exportImage}
          >
            Exportar
          </button>
        )}
      </div>
      {imageUrl && (
        <Annotation
          src={imageUrl}
          alt="Roof"
          annotations={annotations}
          value={annotation}
          onChange={setAnnotation}
          onSubmit={(ann) => {
            const { geometry, data } = ann;
            setAnnotation({});
            setAnnotations([
              ...annotations,
              { geometry, data: { ...data, id: Math.random() } },
            ]);
          }}
        />
      )}
    </div>
  );
}
