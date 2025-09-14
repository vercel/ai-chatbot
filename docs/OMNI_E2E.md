# Fluxos E2E (Omni) — Bus → Workers → Agents → Dispatcher

Este guia descreve os fluxos de ponta‑a‑ponta para mensagens inbound/outbound, incluindo filas Redis Streams, consumidores e adaptadores.

## Diagrama (Mermaid)

```mermaid
sequenceDiagram
  autonumber
  participant API as API /api/omni/*
  participant BUS as Redis Stream (omni.messages / omni.outbox)
  participant IN as InboundConsumer (workers/inbound-consumer)
  participant AG as Agents Router (agents/router)
  participant SM as send_message (agents/tools)
  participant OB as Stream omni.outbox
  participant DP as Dispatcher (workers/dispatcher)
  participant AD as Adapter (adapters/whatsapp)
  participant MCP as MCP Simulator (scripts/mcp-sim)

  API->>BUS: xAdd omni.messages {payload}
  IN->>BUS: xReadGroup omni.messages
  IN->>AG: handleIncoming(inbound)
  AG->>SM: send_message(outbound)
  SM->>OB: publishWithRetry(omni.outbox)
  DP->>OB: xReadGroup omni.outbox
  DP->>AD: dispatch(canonical)
  AD->>MCP: HTTP POST /send (Idempotency-Key)
  MCP-->>AD: {status: sent}
  DP->>OB: xAck id; status: sent
```

## Teste local — Passo a passo

Pré‑requisitos:
- Redis local (`REDIS_URL=redis://localhost:6379`)
- Node.js 20+, pnpm

1. Iniciar simulador MCP (WhatsApp):
```bash
pnpm tsx scripts/mcp-sim.ts
```
Variáveis:
- `MCP_WHATSAPP_URL=http://localhost:4000`
- `MCP_TOKEN=dev-token`

2. Publicar inbound e processar:
```bash
curl -sS -X POST http://localhost:3000/api/omni/inbox \
  -H 'content-type: application/json' \
  -d '{"channel":"whatsapp","direction":"in","conversationId":"conv-1","from":{"id":"user:1"},"to":{"id":"agent:bot"},"timestamp":'$(date +%s000)',"text":"Oi"}'
```

3. Workers (dev): execute run‑scripts ou chame `runOnce()` em testes. Os testes de integração cobrem o ciclo:
- `workers/inbound-consumer.test.ts`
- `workers/dispatcher.test.ts`
- `tests/integration/pipeline-e2e.spec.ts`

## Métricas e Monitoramento

- Habilitar Prometheus: `PROMETHEUS_ENABLED=true`
- Endpoints:
  - JSON: `/api/monitoring/performance` (contadores + p95)
  - Prom text: `/api/monitoring/metrics`
- UI: `/monitoring/omni-metrics` (snapshot + per‑channel latências)

## Idempotência e Deduplicação

- Outbox: `send_message()` usa Redis `SET NX EX` por `message.id` para dedupe.
- MCP/Adapter: cabeçalho `Idempotency-Key` para evitar envios duplicados.

## Rate‑limit e Sanitização

- Limite por IP/usuário nas rotas `/api/omni/*` e `/api/chat/*` via token‑bucket.
- Env: `RATE_LIMIT_RPS`, `RATE_LIMIT_BURST`.
- Sanitização remove `password`, `token`, `apiKey`, e mascara `email`.

