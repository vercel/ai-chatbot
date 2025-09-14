import { Channel } from './schema';

const now = Date.now();

export const exampleInboundWhatsAppValid = {
  message: {
    id: 'in-wa-1',
    channel: 'whatsapp' as Channel,
    direction: 'in' as const,
    conversationId: 'conv-001',
    from: { id: 'user:wa:+5511999999999', phone: '+5511999999999', displayName: 'Cliente' },
    to: { id: 'agent:wa:5511888888888', phone: '5511888888888', displayName: 'YSH Bot' },
    timestamp: now,
    text: 'Oi, quero um orçamento',
    metadata: { locale: 'pt-BR' },
  },
};

export const exampleOutboundEmailValid = {
  message: {
    id: 'out-mail-1',
    channel: 'email' as Channel,
    direction: 'out' as const,
    conversationId: 'conv-001',
    from: { id: 'agent:mail:bot@ysh.energy', email: 'bot@ysh.energy', displayName: 'YSH Bot' },
    to: { id: 'user:mail:c@example.com', email: 'c@example.com', displayName: 'Cliente' },
    timestamp: now,
    text: 'Sua proposta está pronta',
  },
};

export const exampleInboundInvalidMissingTo = {
  message: {
    id: 'in-wa-bad',
    channel: 'whatsapp' as Channel,
    direction: 'in' as const,
    conversationId: 'conv-002',
    // from ok
    from: { id: 'user:wa:+5511999999999' },
    // to missing
    timestamp: now,
    text: 'Sem destinatário',
  },
};

export const exampleOutboundInvalidWrongChannel = {
  message: {
    id: 'out-bad',
    // @ts-expect-error invalid channel at runtime; left as fixture
    channel: 'fax',
    direction: 'out' as const,
    conversationId: 'conv-003',
    from: { id: 'bot' },
    to: { id: 'user' },
    timestamp: now,
    text: 'oi',
  },
};

