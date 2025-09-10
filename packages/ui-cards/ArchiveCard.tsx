import React, { useRef } from 'react';
import { z } from 'zod';
import { track } from '../../apps/web/lib/analytics/events.pix';

// Schema validation for archive receipt data
export const archiveReceiptSchema = z.object({
  archived_at: z.string(),
  ttl_policy: z.number(), // in days
  checksum: z.string(),
});

export type ArchiveReceiptData = z.infer<typeof archiveReceiptSchema>;

export interface ArchiveCardProps extends ArchiveReceiptData {
  onRestore?: () => void;
}

// Calculate remaining TTL in days
export function calculateTTL(
  archivedAt: string,
  ttlDays: number,
  now: Date = new Date(),
): number {
  const archivedDate = new Date(archivedAt);
  const expiresAt = new Date(archivedDate.getTime() + ttlDays * 24 * 60 * 60 * 1000);
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export const ArchiveCard: React.FC<ArchiveCardProps> = (props) => {
  const data = archiveReceiptSchema.parse(props);
  const ttl = calculateTTL(data.archived_at, data.ttl_policy);
  const ref = useRef<HTMLDivElement>(null);

  const exportAsPNG = async () => {
    if (!ref.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = 'archive-card.png';
    link.href = dataUrl;
    link.click();
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'archive-card.json';
    link.href = url;
    link.click();
  };

  const copyChecksum = async () => {
    await navigator.clipboard.writeText(data.checksum);
    track({ name: 'ux.copy_click', payload: { component_id: 'archive_checksum' } });
  };

  return (
    <div ref={ref} className="p-4 border rounded w-64">
      <h3 className="font-bold mb-2">Recibo de Arquivamento</h3>
      <p>
        <span className="font-semibold">Arquivado em:</span>{' '}
        {new Date(data.archived_at).toLocaleString()}
      </p>
      <p>
        <span className="font-semibold">TTL:</span> {ttl} dias
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className="truncate">{data.checksum}</span>
        <button type="button" onClick={copyChecksum} className="px-2 py-1 border rounded">
          Copiar
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        {props.onRestore && (
          <button
            type="button"
            onClick={props.onRestore}
            className="px-2 py-1 border rounded"
          >
            Restaurar
          </button>
        )}
        <button type="button" onClick={exportAsPNG} className="px-2 py-1 border rounded">
          PNG
        </button>
        <button type="button" onClick={exportAsJSON} className="px-2 py-1 border rounded">
          JSON
        </button>
      </div>
    </div>
  );
};

export default ArchiveCard;
