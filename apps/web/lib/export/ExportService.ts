import { Buffer } from 'node:buffer';

export type ExportFormat = 'png' | 'pdf' | 'json' | 'csv';

export interface ExportCard {
  leadId: string;
  artifact: string;
  data: Record<string, unknown>;
}

export interface ExportOptions {
  format: ExportFormat;
  resolution?: number;
}

export interface ExportedFile {
  filename: string;
  data: Uint8Array;
}

/**
 * ExportService generates files for different formats embedding metadata and
 * respecting the naming convention `{lead_id}_{Artifact}_{YYYYMMDD_HHMMSS}`.
 */
export const ExportService = {
  exportCards(cards: ExportCard[], options: ExportOptions): ExportedFile[] {
    return cards.map((card) => this.exportCard(card, options));
  },

  exportCard(card: ExportCard, options: ExportOptions): ExportedFile {
    const now = new Date();
    const timestamp = formatTimestamp(now);
    const filename = `${card.leadId}_${card.artifact}_${timestamp}.${options.format}`;
    const metadata = {
      leadId: card.leadId,
      artifact: card.artifact,
      timestamp: now.toISOString(),
      resolution: options.resolution ?? 1,
    };
    let data: Uint8Array;
    switch (options.format) {
      case 'png':
        data = generatePng(card.data, metadata);
        break;
      case 'pdf':
        data = generatePdf(card.data, metadata);
        break;
      case 'json':
        data = generateJson(card.data, metadata);
        break;
      case 'csv':
        data = generateCsv(card.data, metadata);
        break;
      default:
        throw new Error('Unsupported format');
    }
    return { filename, data };
  },
};

function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}${m}${day}_${h}${min}${s}`;
}

function generateJson(data: Record<string, unknown>, metadata: Record<string, unknown>): Uint8Array {
  const payload = JSON.stringify({ metadata, data });
  return new TextEncoder().encode(payload);
}

function generateCsv(data: Record<string, unknown>, metadata: Record<string, unknown>): Uint8Array {
  const headers = Object.keys(data);
  const values = headers.map((h) => String(data[h] ?? ''));
  const lines = [
    `#metadata,${JSON.stringify(metadata)}`,
    headers.join(','),
    values.join(','),
  ];
  return new TextEncoder().encode(lines.join('\n'));
}

// Minimal PNG (1x1 transparent) with metadata tEXt chunk
function generatePng(data: Record<string, unknown>, metadata: Record<string, unknown>): Uint8Array {
  const base = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AAPAEB/wF/gYkAAAAASUVORK5CYII=',
    'base64',
  );
  const metaText = Buffer.from(`metadata\0${JSON.stringify(metadata)}`, 'utf8');
  const chunkType = Buffer.from('tEXt');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(metaText.length, 0);
  const crc = crc32(Buffer.concat([chunkType, metaText]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  const textChunk = Buffer.concat([length, chunkType, metaText, crcBuf]);
  // insert before IEND (last 12 bytes)
  const png = Buffer.concat([base.slice(0, -12), textChunk, base.slice(-12)]);
  return new Uint8Array(png);
}

// Minimal PDF with metadata comment and Info dictionary
function generatePdf(data: Record<string, unknown>, metadata: Record<string, unknown>): Uint8Array {
  const meta = JSON.stringify(metadata);
  let content = '%PDF-1.4\n';
  const offsets: number[] = [0];
  const objs: string[] = [];
  const addObj = (obj: string) => {
    offsets.push(Buffer.byteLength(content, 'utf8'));
    objs.push(obj);
    content += `${objs.length} 0 obj\n${obj}\nendobj\n`;
  };
  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObj('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>');
  addObj(`<< /Producer (ExportService) /Metadata (${meta}) >>`);
  const xrefPosition = Buffer.byteLength(content, 'utf8');
  content += `xref\n0 ${offsets.length}\n`;
  content += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    const off = offsets[i].toString().padStart(10, '0');
    content += `${off} 00000 n \n`;
  }
  content += `trailer\n<< /Size ${offsets.length} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
  return new TextEncoder().encode(content);
}

// CRC32 implementation for PNG chunks
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export default ExportService;
