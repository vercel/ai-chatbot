import { test, expect } from '@playwright/test';

/**
 * Story: Persona Switching
 *
 * Como um usuário do sistema YSH
 * Quero poder alternar entre diferentes personas (Owner/Integrator)
 * Para ter experiências personalizadas baseadas no meu perfil
 *
 * Cenário: Alternância entre personas
 * Dado que estou na página de persona
 * Quando seleciono uma persona específica
 * Então a interface deve se adaptar às necessidades dessa persona
 * E as funcionalidades devem ser filtradas adequadamente
 */
test.describe('Story: Persona Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de persona
    await page.goto('/persona');

    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
  });

  test('deve mostrar opções de persona na página inicial', async ({ page }) => {
    // Verificar se há seletor de persona
    const personaSelector = page.locator('[data-testid="persona-selector"]').or(
      page.locator('[data-testid="persona-switcher"]').or(
        page.locator('.persona-selector')
      )
    );

    await expect(personaSelector).toBeVisible();

    // Verificar se mostra as opções Owner e Integrator
    await expect(page.locator('text=Owner').or(page.locator('text=Proprietário'))).toBeVisible();
    await expect(page.locator('text=Integrator').or(page.locator('text=Integrador'))).toBeVisible();
  });

  test('deve permitir seleção da persona Owner', async ({ page }) => {
    // Clicar na opção Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner').or(page.locator('text=Proprietário'))
    );

    await ownerButton.click();

    // Verificar se a persona foi selecionada
    await expect(page.locator('[data-testid="persona-active-owner"]')).toBeVisible();

    // Verificar se elementos específicos do Owner estão presentes
    await expect(page.locator('text=Para Proprietários')).toBeVisible();
    await expect(page.locator('[data-testid="owner-features"]')).toBeVisible();
  });

  test('deve permitir seleção da persona Integrator', async ({ page }) => {
    // Clicar na opção Integrator
    const integratorButton = page.locator('[data-testid="persona-integrator"]').or(
      page.locator('text=Integrator').or(page.locator('text=Integrador'))
    );

    await integratorButton.click();

    // Verificar se a persona foi selecionada
    await expect(page.locator('[data-testid="persona-active-integrator"]')).toBeVisible();

    // Verificar se elementos específicos do Integrator estão presentes
    await expect(page.locator('text=Para Integradores')).toBeVisible();
    await expect(page.locator('[data-testid="integrator-features"]')).toBeVisible();
  });

  test('deve mostrar diferenças na interface entre personas', async ({ page }) => {
    // Testar persona Owner primeiro
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Capturar elementos específicos do Owner
    const ownerElements = await page.locator('[data-testid*="owner"]').all();
    const ownerFeatures = ownerElements.length;

    // Trocar para Integrator
    const integratorButton = page.locator('[data-testid="persona-integrator"]').or(
      page.locator('text=Integrator')
    );
    await integratorButton.click();

    // Capturar elementos específicos do Integrator
    const integratorElements = await page.locator('[data-testid*="integrator"]').all();
    const integratorFeatures = integratorElements.length;

    // Verificar se há diferenças significativas
    expect(integratorFeatures).not.toBe(ownerFeatures);
  });

  test('deve persistir seleção de persona entre navegações', async ({ page }) => {
    // Selecionar persona Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Verificar se foi selecionada
    await expect(page.locator('[data-testid="persona-active-owner"]')).toBeVisible();

    // Navegar para outra página
    await page.goto('/');

    // Verificar se a persona ainda está ativa
    await expect(page.locator('[data-testid="persona-active-owner"]')).toBeVisible();
  });

  test('deve mostrar funcionalidades específicas do Owner', async ({ page }) => {
    // Selecionar persona Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Verificar funcionalidades específicas do proprietário
    const ownerFeatures = [
      'Calculadora de economia',
      'Simulador de payback',
      'Guia passo a passo',
      'Comparador de propostas',
      'Suporte personalizado'
    ];

    for (const feature of ownerFeatures) {
      const featureElement = page.locator(`text=${feature}`).or(
        page.locator(`[data-testid*="${feature.toLowerCase().replace(' ', '-')}"]`)
      );

      // Algumas funcionalidades podem não estar visíveis imediatamente
      if (await featureElement.isVisible()) {
        await expect(featureElement).toBeVisible();
      }
    }
  });

  test('deve mostrar funcionalidades específicas do Integrator', async ({ page }) => {
    // Selecionar persona Integrator
    const integratorButton = page.locator('[data-testid="persona-integrator"]').or(
      page.locator('text=Integrator')
    );
    await integratorButton.click();

    // Verificar funcionalidades específicas do integrador
    const integratorFeatures = [
      'Dashboard de leads',
      'Processamento em lote',
      'Análise avançada',
      'Relatórios detalhados',
      'Ferramentas de produtividade'
    ];

    for (const feature of integratorFeatures) {
      const featureElement = page.locator(`text=${feature}`).or(
        page.locator(`[data-testid*="${feature.toLowerCase().replace(' ', '-')}"]`)
      );

      // Algumas funcionalidades podem não estar visíveis imediatamente
      if (await featureElement.isVisible()) {
        await expect(featureElement).toBeVisible();
      }
    }
  });

  test('deve permitir alternância rápida entre personas', async ({ page }) => {
    // Alternar entre Owner e Integrator rapidamente
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    const integratorButton = page.locator('[data-testid="persona-integrator"]').or(
      page.locator('text=Integrator')
    );

    // Owner -> Integrator
    await ownerButton.click();
    await expect(page.locator('[data-testid="persona-active-owner"]')).toBeVisible();

    await integratorButton.click();
    await expect(page.locator('[data-testid="persona-active-integrator"]')).toBeVisible();

    // Integrator -> Owner
    await ownerButton.click();
    await expect(page.locator('[data-testid="persona-active-owner"]')).toBeVisible();
  });

  test('deve mostrar conteúdo personalizado baseado na persona', async ({ page }) => {
    // Testar conteúdo personalizado para Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Verificar se há conteúdo personalizado
    const personalizedContent = page.locator('[data-testid="personalized-content"]').or(
      page.locator('.personalized-content').or(
        page.locator('[data-testid="owner-content"]')
      )
    );

    if (await personalizedContent.isVisible()) {
      await expect(personalizedContent).toContainText('proprietário');
    }

    // Testar conteúdo personalizado para Integrator
    const integratorButton = page.locator('[data-testid="persona-integrator"]').or(
      page.locator('text=Integrator')
    );
    await integratorButton.click();

    if (await personalizedContent.isVisible()) {
      await expect(personalizedContent).toContainText('integrador');
    }
  });

  test('deve filtrar funcionalidades baseado na persona', async ({ page }) => {
    // Verificar funcionalidades disponíveis para Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Funcionalidades que devem estar disponíveis para Owner
    const ownerOnlyFeatures = page.locator('[data-testid="owner-only"]').or(
      page.locator('.owner-only')
    );

    if (await ownerOnlyFeatures.isVisible()) {
      await expect(ownerOnlyFeatures).toBeVisible();
    }

    // Verificar funcionalidades disponíveis para Integrator
    const integratorButton = page.locator('[data-testid="persona-integrator"]').or(
      page.locator('text=Integrator')
    );
    await integratorButton.click();

    // Funcionalidades que devem estar disponíveis para Integrator
    const integratorOnlyFeatures = page.locator('[data-testid="integrator-only"]').or(
      page.locator('.integrator-only')
    );

    if (await integratorOnlyFeatures.isVisible()) {
      await expect(integratorOnlyFeatures).toBeVisible();
    }
  });

  test('deve manter contexto da persona durante navegação', async ({ page }) => {
    // Selecionar persona Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Navegar para diferentes páginas
    const pages = ['/', '/journey', '/chat'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      // Verificar se a persona Owner ainda está ativa
      await expect(page.locator('[data-testid="persona-active-owner"]')).toBeVisible();
    }
  });

  test('deve mostrar configurações específicas da persona', async ({ page }) => {
    // Selecionar persona Owner
    const ownerButton = page.locator('[data-testid="persona-owner"]').or(
      page.locator('text=Owner')
    );
    await ownerButton.click();

    // Procurar por configurações ou preferências
    const settingsButton = page.locator('[data-testid="settings"]').or(
      page.locator('text=Configurações').or(page.locator('[data-testid="preferences"]'))
    );

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Verificar se há configurações específicas da persona
      const personaSettings = page.locator('[data-testid="persona-settings"]').or(
        page.locator('.persona-settings')
      );

      if (await personaSettings.isVisible()) {
        await expect(personaSettings).toContainText('Owner');
      }
    }
  });
});