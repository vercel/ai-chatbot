# YSH Fixtures

Convenções para geração de fixtures determinísticas para testes visuais.

- Locale: pt-BR; datas em ISO-8601 UTC.
- Pastas de saída:
  - `data/mocks/leads/` -> arquivos `leads_pf.json`, `leads_pj.json`.
  - `data/mocks/outputs/investigation/` -> artefatos por lead: validação e enriquecimento.
- Nomes de arquivo: `{lead_id}_{Artifact}_{YYYYMMDD_HHMMSS}.json` (o gerador usa timestamp atual).
- Determinismo: passe `seed` numérico ao script `scripts/generate-leads.js`.

## Como rodar

### Via npm script (recomendado)

```bash
pnpm run generate:leads 42
```

### Via node diretamente

```bash
node scripts/generate-leads.js 42
```

### Exemplo de saída

- `data/mocks/leads/leads_pf.json` (20 leads PF)
- `data/mocks/leads/leads_pj.json` (10 leads PJ)
- `data/mocks/outputs/investigation/L000001_LeadDataValidated_20250905_175946.json`
- `data/mocks/outputs/investigation/L000001_LeadProfileEnriched_20250905_175946.json`
