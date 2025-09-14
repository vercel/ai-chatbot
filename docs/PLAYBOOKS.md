# Playbooks Operacionais

Este documento lista procedimentos práticos para operar, depurar e recuperar o sistema Omni.

## Tabela de conteúdos
- Fila travada (Streams Redis)
- MCP/Provedor com 429 (throttling)
- Troca de modelo e preferências (Load Balancer)
- Ativar simulador MCP
- Habilitar métricas (Prom/OTel)
- Rollback e recuperação

---

## Fila travada (Streams Redis)

Sintomas: mensagens “presas” sem ack na `omni.messages` ou `omni.outbox`.

Checklist:
1) Ver pendências do grupo (ex.: dispatcher):
```bash
redis-cli XPENDING omni.outbox dispatcher - + 10
```
2) Reivindicar mensagens “órfãs” (idle > 5s) com `xAutoClaim` (nos workers é chamado automaticamente). Manual:
```bash
redis-cli XAUTOCLAIM omni.outbox dispatcher my-repair 5000 0-0 COUNT 100
```
3) Conferir DLQ (`omni.dlq`) para malformados e corrigir payloads.
4) Verificar status por id: `HGETALL status:<id>`.

Reprocessar manualmente (dev): chame `runOnce()` dos workers ou reinicie os processos supervisores.

## MCP/Provedor 429 (throttling)

Sintomas: erros `429` do provedor primário.

Mitigações:
- O `trackAIRequest` faz fallback cascata automaticamente (429/timeout).
- Ajuste o rate interno: `RATE_LIMIT_RPS`, `RATE_LIMIT_BURST`.
- Ajuste ordem de provedores: `PROVIDER_PRIORITY_ORDER` (ex.: `xai,ollama,anthropic,openai,google`).
- Reduza `MAX_LATENCY_MS` e/ou `MAX_COST_PER_REQUEST` conforme orçamento.

## Troca de modelo e preferências (Load Balancer)

Políticas em `lib/load-balancing/load-balancer.ts`.

Formas de alterar:
- Global (env):
  - `PROVIDER_PRIORITY_ORDER`
  - `PROVIDER_TIMEOUT_MS`, `MAX_LATENCY_MS`, `MAX_COST_PER_REQUEST`
- Por chamada (server/route): `withModel({ preferredProvider, maxCost, maxLatencyMs, providers }, fn)`

## Ativar simulador MCP

Ambiente local:
```bash
pnpm tsx scripts/mcp-sim.ts
```
Env necessários:
- `MCP_WHATSAPP_URL=http://localhost:4000`
- `MCP_TOKEN=dev-token`

Teste rápido (adapter): veja `tests/integration/whatsapp-adapter.spec.ts`.

## Habilitar métricas (Prom/OTel)

Prometheus (opcional):
- `PROMETHEUS_ENABLED=true`
- Scrape: `GET /api/monitoring/metrics`
- Snapshot JSON: `GET /api/monitoring/performance`
- UI: `/monitoring/omni-metrics`

OpenTelemetry (opcional):
- `OTEL_METRICS=on`

Métricas expostas:
- Contadores: `inbound_total{channel}`, `outbound_total{channel}`, `dispatcher_total{channel}`, `ai_requests_total{provider,model,phase}`
- Histogramas: `inbound_ms{channel}`, `dispatch_ms{channel}`, `ai_latency_ms{provider,model}`

## Rollback e recuperação

Fluxo sugerido:
1) Pausar workers (inbound/dispatcher) para congelar consumo.
2) Corrigir configuração/feature flag.
3) Validar com `runOnce()` e inspeção de status.
4) Reativar workers.

Desfazer deploy:
- Se em Vercel: promover build anterior.
- Se on‑prem: reverter imagem/tags com o orquestrador (K8s/Nomad/PM2) e reiniciar.

