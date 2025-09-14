# Auth & Middleware — Allowlist e Bypass de Test/CI

Este documento descreve a estratégia para permitir acesso sem autenticação a rotas específicas
em ambientes de teste/CI e, opcionalmente, em produção via allowlist controlada por variável de ambiente.

## Objetivos

- Garantir que rotas de saúde/monitoramento e do barramento Omni funcionem em CI sem login.
- Permitir, quando explicitado, liberar rotas não sensíveis em produção (ex.: `/ping`, métricas).
- Minimizar o risco de exposição de dados, restringindo o escopo a rotas de leitura/telemetria.

## Comportamento do Middleware

O `middleware.ts` avalia a permissão por meio de `isAllowedPath(pathname)`:

- Bypass automático quando `NODE_ENV` é `test` ou `ci` e a rota começa com:
  - `/api/monitoring/`
  - `/api/omni/`
  - `/ping`
- Allowlist opcional via `AUTH_ALLOWLIST`, uma lista separada por vírgulas, com padrões exatos ou de prefixo `/*`.

Exemplos de padrões:

- `/ping` → corresponde exatamente a `/ping` (ou prefixo imediato `/ping/...`).
- `/api/monitoring/*` → corresponde a qualquer subrota de `/api/monitoring/`.

## Configuração

No arquivo `.env`:

```
# Permite /ping e /api/monitoring/* sem auth
AUTH_ALLOWLIST=/ping,/api/monitoring/*
```

Em ambientes de CI, defina `NODE_ENV=test` (ou `ci`) — o bypass é automático para as rotas listadas acima.

## Riscos e Cuidados

- Não inclua rotas que manipulem dados sensíveis ou que aceitem escrita na allowlist.
- Evite incluir `/api/omni/*` em produção, a menos que esteja explicitamente isolado para testes internos.
- Revise periodicamente o valor de `AUTH_ALLOWLIST` e monitore logs de acesso.
- Em produção, prefira permitir apenas `/ping` e rotas de métricas READ‑ONLY.

## Testes

Cobertos em `tests/unit/middleware.spec.ts` para:
- Produção sem allowlist (deve exigir auth)
- Produção com allowlist (bypass quando padrão correspondente)
- Test/CI (bypass automático nas rotas de saúde/monitoring/omni)

