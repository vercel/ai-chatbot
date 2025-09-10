import { describe, it, expect } from 'vitest';
import { route, type HostContext } from './router-agent';

describe('RouterAgent', () => {
  const baseCtx: HostContext = {
    persona: { mode: 'guest', permissions: [], featureFlags: {} },
    auth: { quota: { usedToday: 0, limit: 20 } },
    providers: {
      gateway: 'vercel',
      defaultModel: 'grok-3-mini-beta',
      fallbacks: ['gpt-4.1-mini', 'claude-3.5-sonnet'],
    },
  };

  it('seleciona modelo leve para convidados', () => {
    const res = route('Olá', baseCtx);
    expect(res.model_hint).toBe('grok-3-mini-beta');
  });

  it('seleciona modelo avançado para usuários regulares e detecta intenção de vendas', () => {
    const ctx: HostContext = {
      ...baseCtx,
      persona: { ...baseCtx.persona, mode: 'regular' },
    };
    const res = route('Quero comprar um sistema', ctx);
    expect(res.model_hint).toBe('gpt-4.1');
    expect(res.intent).toBe('sales/presales');
  });

  it('bloqueia quando a cota é excedida', () => {
    const ctx: HostContext = {
      ...baseCtx,
      auth: { quota: { usedToday: 20, limit: 20 } },
    };
    const res = route('Qualquer coisa', ctx);
    expect(res.reply).toMatch(/cota diária/);
    expect(res.next_agent).toBe('self');
  });
});
