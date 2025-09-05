import { describe, it, expect } from 'vitest';
import { parseSources } from '../parsers';

describe('parseSources', () => {
  it('extracts markdown links', () => {
    const text = 'Veja [IBGE](https://ibge.gov.br) e [PVGIS](https://re.jrc.ec.europa.eu/pvg_tools).';
    const sources = parseSources(text);
    expect(sources).toHaveLength(2);
    expect(sources[0].label).toBe('IBGE');
  });
});
