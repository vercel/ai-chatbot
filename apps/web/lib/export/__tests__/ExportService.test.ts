import { describe, it, expect } from 'vitest';
import ExportService from '../ExportService';

const sampleCard = {
  leadId: '42',
  artifact: 'Card',
  data: { foo: 'bar', num: 1 },
};

describe('ExportService', () => {
  it('generates filename with convention', () => {
    const { filename } = ExportService.exportCard(sampleCard, { format: 'json' });
    expect(filename).toMatch(/^42_Card_\d{8}_\d{6}\.json$/);
  });

  it('exports batch of cards', () => {
    const files = ExportService.exportCards([sampleCard, sampleCard], { format: 'csv' });
    expect(files).toHaveLength(2);
    for (const file of files) {
      expect(file.filename).toMatch(/^42_Card_\d{8}_\d{6}\.csv$/);
    }
  });

  it('embeds metadata in png and pdf', () => {
    const png = ExportService.exportCard(sampleCard, { format: 'png' });
    const pdf = ExportService.exportCard(sampleCard, { format: 'pdf' });
    expect(Buffer.from(png.data).slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(Buffer.from(png.data).includes('metadata'.toString())).toBe(true);
    expect(Buffer.from(pdf.data).toString().startsWith('%PDF')).toBe(true);
    expect(Buffer.from(pdf.data).toString().trim().endsWith('%%EOF')).toBe(true);
  });
});
