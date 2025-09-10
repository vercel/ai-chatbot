import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../tools/send_message', () => ({ send_message: vi.fn() }));
vi.mock('../kb/kb_search', () => ({ kb_search: vi.fn(async () => []) }));

import { triage } from './triage';
import { send_message } from '../tools/send_message';
import { kb_search } from '../kb/kb_search';

describe('triage router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responds to greeting', async () => {
    await triage({ text: 'Oi', channel: 'whatsapp' });
    expect(send_message).toHaveBeenCalledWith({
      channel: 'whatsapp',
      text: expect.stringMatching(/olá/i),
    });
  });

  it('asks for sales data on budget intent', async () => {
    await triage({ text: 'Quero um orçamento', channel: 'web' });
    const sent = (send_message as any).mock.calls[0][0];
    expect(sent.text).toMatch(/consumo.*kwh/i);
    expect(sent.text).toMatch(/cep/i);
    expect(sent.text).toMatch(/fase/i);
    expect(sent.text).toMatch(/telefone/i);
  });

  it('includes kb snippet when available', async () => {
    (kb_search as any).mockResolvedValue([{ snippet: 'garantia de 10 anos' }]);
    await triage({ text: 'Qual a garantia?', channel: 'chat' });
    const sent = (send_message as any).mock.calls[0][0];
    expect(sent.text).toMatch(/garantia de 10 anos/);
  });
});
