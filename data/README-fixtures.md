# YSH Fixtures

Convenções para geração de fixtures determinísticas para testes visuais.

- Locale: pt-BR; datas em ISO-8601 UTC.
- Pastas de saída:
  - `data/mocks/leads/` -> arquivos `leads_pf.json`, `leads_pj.json`.
  - `data/mocks/outputs/investigation/` -> artefatos por lead: validação e enriquecimento.
- Nomes de arquivo: `{lead_id}_{Artifact}_{YYYYMMDD_HHMMSS}.json` (o gerador usa timestamp atual).
- Determinismo: passe `seed` numérico ao script `scripts/generate-leads.js`.

Como rodar (pwsh):

```pwsh
node scripts/generate-leads.js 42
```
