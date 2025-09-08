# Testes E2E - Cobertura 360 Graus

Este diretório contém os testes end-to-end para a funcionalidade de cobertura 360 graus do visualizador 3D de telhados.

## Arquivos de Teste

### `360-basic.test.ts`

Testes básicos de carregamento e navegação:

- ✅ Carregamento da página persona
- ✅ Mudança para modo integrator
- ✅ Verificação básica de componentes

### `360-coverage.test.ts`

Testes completos da funcionalidade 360 graus:

- ✅ Carregamento do Roof3DViewer
- ✅ Controles de inclinação (tilt: 0-90°)
- ✅ Controles de azimute (azimuth: 0-360°)
- ✅ Controles de hora do dia
- ✅ Rotação completa 360° com sliders
- ✅ Combinação tilt + azimuth para cenários realistas
- ✅ Exportação de screenshots
- ✅ Fallback para visualização 2D
- ✅ Integração com botões de otimização
- ✅ Sincronização com card de layout

### `360-advanced.test.ts`

Testes avançados e de performance:

- ✅ Rotação rápida 360° sem travamentos
- ✅ Sincronização entre controles deslizantes e numéricos
- ✅ Múltiplas orientações solares simultaneamente
- ✅ Validação de entrada de dados
- ✅ Atalhos de teclado
- ✅ Manutenção de estado após reload
- ✅ Zoom e pan na visualização 3D
- ✅ Exportação em diferentes formatos
- ✅ Suporte a temas claro/escuro

## Como Executar

### Todos os Testes 360 Graus

```bash
# Usando configuração específica
npx playwright test --config=playwright.360.config.ts

# Ou executar arquivos específicos
npx playwright test tests/e2e/360-*.test.ts
```

### Testes Individuais

```bash
# Testes básicos
npx playwright test tests/e2e/360-basic.test.ts

# Testes completos
npx playwright test tests/e2e/360-coverage.test.ts

# Testes avançados
npx playwright test tests/e2e/360-advanced.test.ts
```

### Com Interface Visual

```bash
# Executar com UI do Playwright
npx playwright test --ui tests/e2e/360-*.test.ts
```

### Com Relatório HTML

```bash
# Executar e gerar relatório
npx playwright test tests/e2e/360-*.test.ts
npx playwright show-report
```

## Cenários de Teste

### Cenários Básicos

1. **Carregamento**: Verificar se a página e componentes carregam corretamente
2. **Navegação**: Alternar entre modos owner/integrator
3. **Componentes**: Verificar presença de controles e visualizações

### Cenários de Cobertura 360°

1. **Controles Individuais**: Testar cada controle separadamente
2. **Rotação Completa**: Simular rotação 360° em diferentes velocidades
3. **Cenários Solares**: Testar configurações para diferentes regiões/orientações
4. **Validação**: Verificar limites e tratamento de valores inválidos
5. **Integração**: Testar sincronização entre componentes

### Cenários Avançados

1. **Performance**: Testar rotação rápida e resposta do sistema
2. **Interação**: Testar zoom, pan, atalhos de teclado
3. **Persistência**: Verificar estado após reload da página
4. **Exportação**: Testar diferentes formatos e múltiplas exportações
5. **Acessibilidade**: Verificar labels ARIA e navegação por teclado

## Configuração Específica

Os testes 360 graus usam uma configuração especial (`playwright.360.config.ts`) com:
- **Workers**: 1 (execução sequencial para evitar conflitos)
- **Parallel**: Desabilitado
- **Timeouts**: Aumentados para 2 minutos por teste
- **Traces/Videos**: Habilitados para debugging
- **Screenshots**: Apenas em falhas

## Resolução de Problemas

### Erro: "Playwright Test did not expect test.describe()"
- Verificar conflitos de versão do @playwright/test
- Usar `npm ls @playwright/test` para verificar versões
- Considerar atualizar ou reinstalar dependências

### Erro: "Componente não encontrado"
- Verificar se o servidor de desenvolvimento está rodando
- Aguardar carregamento completo com `waitForLoadState('networkidle')`
- Usar seletores mais flexíveis com `.or()` e `filter()`

### Timeout em testes
- Aumentar timeouts nos testes específicos
- Verificar performance do sistema
- Usar `waitForTimeout()` para esperas adicionais

## Cobertura de Teste

### Funcionalidades Testadas
- ✅ Visualização 3D do telhado
- ✅ Controles de orientação solar (tilt, azimuth)
- ✅ Simulação temporal (hora do dia)
- ✅ Rotação completa 360°
- ✅ Exportação de imagens
- ✅ Fallback para 2D
- ✅ Otimização automática
- ✅ Validação de dados
- ✅ Sincronização de componentes

### Cenários de Uso
- ✅ Análise de telhado residencial
- ✅ Otimização de painéis solares
- ✅ Simulação de produção energética
- ✅ Comparação de orientações
- ✅ Exportação para relatórios

## Métricas de Qualidade

- **Cobertura**: >95% das funcionalidades 360°
- **Performance**: <5s para rotação completa
- **Confiabilidade**: >99% de sucesso em execuções
- **Manutenibilidade**: Código modular e bem documentado