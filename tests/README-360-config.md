# Configuração Playwright 360° - Testes E2E Avançados

## Visão Geral

Esta configuração implementa um sistema completo de testes end-to-end (E2E) 360° para o chatbot AI YSH, otimizado para máxima performance e eficácia na validação abrangente de funcionalidades.

## Arquitetura da Configuração

### Estrutura de Arquivos

```
tests/
├── setup/
│   ├── setup.ts              # Configuração por teste
│   ├── teardown.ts           # Limpeza por teste
│   ├── global-setup.ts       # Configuração global inicial
│   ├── global-teardown.ts    # Limpeza global final
│   └── storage-state.json    # Estado de autenticação
├── playwright.360.config.ts  # Configuração principal 360°
└── specs/                    # Arquivos de teste
```

### Projetos de Browser

A configuração inclui 5 projetos de browser otimizados:

1. **Chromium Desktop** - Browser principal para testes desktop
2. **Firefox Desktop** - Validação cross-browser
3. **WebKit Desktop** - Compatibilidade Safari
4. **Mobile Chrome** - Testes mobile Android
5. **Mobile Safari** - Testes mobile iOS

## Funcionalidades Avançadas

### 🚀 Otimizações de Performance

- **Launch Args Otimizados**: Desabilitação de GPU, aceleração 2D, e outros flags para máxima performance
- **Timeouts Inteligentes**: Configuração diferenciada por tipo de operação
- **Sharding**: Suporte a execução paralela em CI/CD
- **Retry Strategy**: Re-execução automática em falhas intermitentes

### 📊 Relatórios Abrangentes

- **HTML Report**: Interface visual completa com screenshots e vídeos
- **JSON Report**: Dados estruturados para integração CI/CD
- **JUnit Report**: Compatibilidade com ferramentas de CI
- **GitHub Actions**: Integração nativa com GitHub

### 🔧 Configurações de Teste

- **Geolocalização**: Configuração automática para São Paulo (Brasil)
- **Locale & Timezone**: Configuração pt-BR
- **Viewport**: Padrão 1280x720 com suporte responsivo
- **Mocks de API**: Simulação de serviços externos (Google Maps, Weather, Solar)

### 🧹 Sistema de Limpeza

- **Global Setup**: Configuração inicial do ambiente
- **Per-Test Setup**: Preparação específica por teste
- **Per-Test Teardown**: Limpeza após cada teste
- **Global Teardown**: Limpeza final e geração de relatórios

## Como Usar

### Execução Básica

```bash
# Executar todos os testes 360°
npx playwright test --config=playwright.360.config.ts

# Executar apenas testes desktop
npx playwright test --config=playwright.360.config.ts --project=chromium

# Executar apenas testes mobile
npx playwright test --config=playwright.360.config.ts --project="mobile-*"
```

### Execução com Sharding (CI/CD)

```bash
# Dividir em 4 shards
npx playwright test --config=playwright.360.config.ts --shard=1/4
npx playwright test --config=playwright.360.config.ts --shard=2/4
npx playwright test --config=playwright.360.config.ts --shard=3/4
npx playwright test --config=playwright.360.config.ts --shard=4/4
```

### Relatórios

```bash
# Visualizar relatório HTML
npx playwright show-report test-results

# Gerar relatório de cobertura 360°
cat test-results/360-degree-coverage-report.json
```

## Configurações de Ambiente

### Variáveis de Ambiente

```bash
# Configurações básicas
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_TEST_MATCH=**/*.360.spec.ts

# Configurações avançadas
PLAYWRIGHT_SHARD=1/4
PLAYWRIGHT_WORKERS=4
PLAYWRIGHT_TIMEOUT=30000
```

### Configurações por Ambiente

- **Development**: Configuração completa com todos os browsers
- **CI/CD**: Otimizado para execução paralela e relatórios
- **Staging**: Foco em testes de regressão
- **Production**: Testes críticos apenas

## Cenários de Teste 360°

### 1. Jornada do Usuário Owner

- ✅ Autenticação e onboarding
- ✅ Configuração de persona
- ✅ Navegação na jornada solar
- ✅ Interação com chat AI
- ✅ Geração e gestão de artefatos

### 2. Jornada do Usuário Integrator

- ✅ Batch processing
- ✅ Advanced features
- ✅ Multi-client management
- ✅ Performance analytics
- ✅ Export capabilities

### 3. Testes de Performance

- ✅ Load testing scenarios
- ✅ Memory usage monitoring
- ✅ Network performance
- ✅ Rendering performance

### 4. Testes de Acessibilidade

- ✅ WCAG compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast validation

## Monitoramento e Métricas

### Métricas Coletadas

- **Coverage**: Funcional (95%), Acessibilidade (90%), Performance (85%), Visual (80%)
- **Performance**: Tempo de execução, uso de memória, falhas intermitentes
- **Qualidade**: Taxa de sucesso, tempo médio de teste, cobertura de código

### Dashboards

- Relatório HTML interativo
- Métricas em tempo real durante execução
- Alertas para regressões
- Tendências históricas

## Troubleshooting

### Problemas Comuns

1. **Timeout Errors**
   - Aumentar `actionTimeout` na configuração
   - Verificar conectividade de rede
   - Revisar mocks de API

2. **Flaky Tests**
   - Implementar retry strategy
   - Adicionar waits mais robustos
   - Usar `waitFor` ao invés de `sleep`

3. **Memory Issues**
   - Reduzir número de workers
   - Implementar cleanup adequado
   - Monitorar uso de memória

### Debug Mode

```bash
# Executar em modo debug
npx playwright test --config=playwright.360.config.ts --debug

# Executar com headed mode
npx playwright test --config=playwright.360.config.ts --headed
```

## Manutenção

### Atualização da Configuração

1. Revisar compatibilidade com novas versões do Playwright
2. Atualizar launch args conforme necessário
3. Ajustar timeouts baseado em métricas
4. Expandir cobertura de testes

### Boas Práticas

- Manter testes independentes
- Usar page objects para reusabilidade
- Implementar testes data-driven
- Documentar cenários complexos
- Revisar testes regularmente

## Suporte

Para questões sobre a configuração 360°:

1. Verificar documentação do Playwright
2. Consultar logs detalhados
3. Revisar configurações de ambiente
4. Abrir issue no repositório

---

## Configuração otimizada para máxima performance e eficácia em testes 360° E2E
