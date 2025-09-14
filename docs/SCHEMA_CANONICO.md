# Esquema Canônico de Mensagens (Omnichannel)

Este documento descreve o esquema canônico de mensagens usado entre API, Bus e Agentes.

- Versão: 1.0
- Tipo: JSON validado com Zod

## Campos principais

| Campo           | Tipo                          | Obrigatório | Descrição |
|-----------------|-------------------------------|-------------|-----------|
| id              | string                         | sim         | Identificador único da mensagem |
| channel         | enum                           | sim         | Canal: `whatsapp`, `email`, `sms`, `telegram`, `instagram`, `linkedin`, `web`, `voice` |
| direction       | enum                           | sim         | Direção: `in` (entrada) ou `out` (saída) |
| conversationId  | string                         | sim         | Identificador do fio de conversa |
| from            | ContactRef                     | sim         | Remetente |
| to              | ContactRef                     | sim         | Destinatário |
| timestamp       | number (epoch ms)              | sim         | Instante do evento |
| text            | string                         | não         | Texto da mensagem |
| media           | Attachment                     | não         | Metadados de anexo |
| metadata        | Record<string, unknown>        | não         | Metadados adicionais |

ContactRef:
- `id: string`
- `phone?: string`
- `email?: string`
- `displayName?: string`
- `handles?: Record<string,string>`

Attachment:
- `url: string` (URL absoluta)
- `mime: string`
- `size?: number`
- `caption?: string`

## Contratos Zod (trechos)

```ts
// lib/omni/schema.ts (trechos relevantes)
export const ChannelSchema = z.enum([
  'whatsapp','email','sms','telegram','instagram','linkedin','web','voice',
]);

export const ContactRefSchema = z.object({
  id: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  handles: z.record(z.string(), z.string()).optional(),
});

export const AttachmentSchema = z.object({
  url: z.string().url(),
  mime: z.string().min(1),
  size: z.number().int().positive().optional(),
  caption: z.string().optional(),
});

export const MessageCanonicalSchema = z.object({
  id: z.string().min(1),
  channel: ChannelSchema,
  direction: z.enum(['in','out']),
  conversationId: z.string().min(1),
  from: ContactRefSchema,
  to: ContactRefSchema,
  timestamp: z.number().int().nonnegative(),
  text: z.string().optional(),
  media: AttachmentSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
```

Helpers de coercion (preenchem defaults e validam):
- `coerceInbound(payload)` → `InboundEnvelope`
- `coerceOutbound(payload)` → `OutboundEnvelope`

## Exemplos

### Inbound (entrada)

```json
{
  "id": "msg-in-123",
  "channel": "whatsapp",
  "direction": "in",
  "conversationId": "conv-1",
  "from": { "id": "user:123", "phone": "+551199999" },
  "to": { "id": "agent:bot" },
  "timestamp": 1731540000000,
  "text": "Olá!"
}
```

### Outbound (saída)

```json
{
  "id": "msg-out-123",
  "channel": "whatsapp",
  "direction": "out",
  "conversationId": "conv-1",
  "from": { "id": "agent:bot" },
  "to": { "id": "user:123", "phone": "+551199999" },
  "timestamp": 1731540000500,
  "text": "Como posso ajudar?"
}
```

## cURL — Publicação via API

Inbound → `/api/omni/inbox`:
```bash
curl -X POST http://localhost:3000/api/omni/inbox \
  -H 'content-type: application/json' \
  -d '{
    "channel": "whatsapp",
    "direction": "in",
    "conversationId": "conv-1",
    "from": { "id": "user:123" },
    "to": { "id": "agent:bot" },
    "timestamp": 1731540000000,
    "text": "Oi"
  }'
```

Outbound → `/api/omni/outbox`:
```bash
curl -X POST http://localhost:3000/api/omni/outbox \
  -H 'content-type: application/json' \
  -d '{
    "channel": "whatsapp",
    "direction": "out",
    "conversationId": "conv-1",
    "from": { "id": "agent:bot" },
    "to": { "id": "user:123" },
    "timestamp": 1731540000500,
    "text": "Como posso ajudar?"
  }'
```

## Versão do esquema
- Major: 1 — compatível enquanto os campos acima forem mantidos.
- Mudanças backward‑compatíveis adicionam campos opcionais.

