# Jornada – CHANGELOG

## 2024-11-24
- Padronizamos breadcrumbs e CTAs em todas as fases da jornada, com `NextCTA` configurado para cada etapa.
- Instrumentamos métricas (`journey_phase_view`, `journey_cta_click`, `analysis_ready_view`, `upload_bill_submitted`, `persona_switch`, `guest_limit_banner_view`, `guest_upgrade_click`).
- Adicionamos banner de limite para convidados com CTA de upgrade e telemetria resiliente.
- Revisamos páginas de Investigação, Detecção, Análise e Dimensionamento com mensagens de apoio, links de suporte e redirecionamentos pós-ação.
- Criamos testes Playwright específicos para owner, integrator, upload e guest-limit garantindo navegação canônica.
