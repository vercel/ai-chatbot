import { describe, it, expect } from 'vitest';
import { handleIncoming } from '@/agents/router';

describe('agents/router handleIncoming', () => {
  it('responds to greeting', async () => {
    const env = {
      message: {
        id: 'm1', channel: 'web', direction: 'in', conversationId: 'c1',
        from: { id: 'user:1' }, to: { id: 'agent:1' }, timestamp: Date.now(), text: 'Oi'
      }
    } as any;
    const outs = await handleIncoming(env);
    expect(outs[0].message.text).toMatch(/olá/i);
  });

  it('uses KB for unknown queries', async () => {
    const env = {
      message: {
        id: 'm2', channel: 'web', direction: 'in', conversationId: 'c2',
        from: { id: 'user:1' }, to: { id: 'agent:1' }, timestamp: Date.now(), text: 'contato'
      }
    } as any;
    const outs = await handleIncoming(env);
    expect(outs[0].message.text).toMatch(/contato|whatsapp|e-mail/i);
  });

  it('sales path on budget intent', async () => {
    const env = {
      message: {
        id: 'm3', channel: 'web', direction: 'in', conversationId: 'c3',
        from: { id: 'user:1' }, to: { id: 'agent:1' }, timestamp: Date.now(), text: 'Quero orçamento'
      }
    } as any;
    const outs = await handleIncoming(env);
    expect(outs[0].message.text).toMatch(/consumo|cep|telefone/i);
  });
});

