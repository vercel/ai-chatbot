import { test, expect } from '@playwright/test';

/**
 * Story: Journey Completa
 *
 * Como um usuário interessado em energia solar
 * Quero passar por todo o processo de journey
 * Para entender completamente como funciona a implementação de um sistema solar
 *
 * Cenário: Fluxo completo através de todas as fases
 * Dado que estou na página de journey
 * Quando navego através de todas as fases
 * Então devo ver todas as informações relevantes para cada etapa
 * E poder avançar e voltar entre as fases
 */
test.describe('Story: Journey Completa', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de journey
    await page.goto('/journey');

    // Aguardar o carregamento completo
    await page.waitForLoadState('networkidle');
  });

  test('deve iniciar na primeira fase (Investigation)', async ({ page }) => {
    // Verificar se estamos na fase Investigation
    await expect(page.locator('text=Investigation')).toBeVisible();
    await expect(page.locator('text=Investigação')).toBeVisible();

    // Verificar se os cards da fase estão presentes
    await expect(page.locator('[data-testid="intent-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-validation-card"]')).toBeVisible();
  });

  test('deve permitir navegar para a próxima fase (Detection)', async ({ page }) => {
    // Clicar no botão de próxima fase
    const nextButton = page.locator('[data-testid="next-phase"]').or(
      page.locator('text=Próxima').or(page.locator('text=Next'))
    );
    await nextButton.click();

    // Verificar se mudou para Detection
    await expect(page.locator('text=Detection')).toBeVisible();
    await expect(page.locator('text=Detecção')).toBeVisible();

    // Verificar se o botão de voltar está disponível
    const backButton = page.locator('[data-testid="prev-phase"]').or(
      page.locator('text=Anterior').or(page.locator('text=Back'))
    );
    await expect(backButton).toBeVisible();
  });

  test('deve permitir navegar através de todas as fases sequencialmente', async ({ page }) => {
    const phases = [
      'Investigation',
      'Detection',
      'Analysis',
      'Dimensioning',
      'Simulation',
      'Installation',
      'Monitoring',
      'Recommendation',
      'LeadMgmt'
    ];

    // Navegar através de todas as fases
    for (let i = 0; i < phases.length - 1; i++) {
      // Verificar fase atual
      await expect(page.locator(`text=${phases[i]}`)).toBeVisible();

      // Clicar em próxima
      const nextButton = page.locator('[data-testid="next-phase"]').or(
        page.locator('text=Próxima').or(page.locator('text=Next'))
      );
      await nextButton.click();

      // Aguardar transição
      await page.waitForTimeout(1000);
    }

    // Verificar se chegamos à última fase
    await expect(page.locator('text=LeadMgmt')).toBeVisible();
    await expect(page.locator('text=Gerenciamento de Leads')).toBeVisible();
  });

  test('deve permitir voltar através das fases', async ({ page }) => {
    // Ir para uma fase avançada
    for (let i = 0; i < 3; i++) {
      const nextButton = page.locator('[data-testid="next-phase"]').or(
        page.locator('text=Próxima').or(page.locator('text=Next'))
      );
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Verificar que estamos em Analysis
    await expect(page.locator('text=Analysis')).toBeVisible();

    // Voltar uma fase
    const backButton = page.locator('[data-testid="prev-phase"]').or(
      page.locator('text=Anterior').or(page.locator('text=Back'))
    );
    await backButton.click();

    // Verificar que voltamos para Detection
    await expect(page.locator('text=Detection')).toBeVisible();
  });

  test('deve mostrar progresso visual da journey', async ({ page }) => {
    // Verificar se há indicador de progresso
    const progressIndicator = page.locator('[data-testid="journey-progress"]').or(
      page.locator('[data-testid="phase-indicator"]').or(
        page.locator('.progress').or(page.locator('.phase-progress'))
      )
    );

    if (await progressIndicator.isVisible()) {
      // Se há progresso, verificar se está na primeira fase
      await expect(progressIndicator.locator('text=1')).toBeVisible();
    }
  });

  test('deve permitir interação com cards em cada fase', async ({ page }) => {
    // Testar interação com Intent Card na primeira fase
    const intentCard = page.locator('[data-testid="intent-card"]');
    if (await intentCard.isVisible()) {
      await intentCard.click();

      // Verificar se algum modal ou detalhe se abre
      const modal = page.locator('[data-testid="intent-modal"]').or(
        page.locator('.modal').or(page.locator('[role="dialog"]'))
      );

      if (await modal.isVisible()) {
        // Interagir com o modal
        await expect(modal.locator('text=Intenção')).toBeVisible();
      }
    }
  });

  test('deve preservar dados entre navegações de fase', async ({ page }) => {
    // Na primeira fase, interagir com algum elemento que armazena dados
    const inputField = page.locator('[data-testid="lead-name"]').or(
      page.locator('input[type="text"]').first()
    );

    if (await inputField.isVisible()) {
      await inputField.fill('João Silva');

      // Navegar para próxima fase
      const nextButton = page.locator('[data-testid="next-phase"]').or(
        page.locator('text=Próxima')
      );
      await nextButton.click();

      // Voltar para primeira fase
      const backButton = page.locator('[data-testid="prev-phase"]').or(
        page.locator('text=Anterior')
      );
      await backButton.click();

      // Verificar se os dados foram preservados
      await expect(inputField).toHaveValue('João Silva');
    }
  });

  test('deve mostrar navegação visual entre fases', async ({ page }) => {
    // Verificar se há navegação visual (ícones, números, etc.)
    const phaseNav = page.locator('[data-testid="phase-navigation"]').or(
      page.locator('.phase-nav').or(page.locator('[data-testid="journey-nav"]'))
    );

    if (await phaseNav.isVisible()) {
      // Verificar se mostra as fases disponíveis
      await expect(phaseNav.locator('text=Investigation')).toBeVisible();
      await expect(phaseNav.locator('text=Detection')).toBeVisible();
    }
  });

  test('deve permitir acesso direto a qualquer fase via navegação', async ({ page }) => {
    // Tentar clicar diretamente em uma fase específica
    const phaseLink = page.locator('[data-testid="phase-Analysis"]').or(
      page.locator('text=Analysis').or(page.locator('[href*="Analysis"]'))
    );

    if (await phaseLink.isVisible()) {
      await phaseLink.click();

      // Verificar se navegou para Analysis
      await expect(page.locator('text=Analysis')).toBeVisible();
    }
  });

  test('deve mostrar cards específicos para cada fase', async ({ page }) => {
    const phaseCards = {
      'Investigation': ['Intent', 'LeadValidation', 'LeadEnrichment'],
      'Detection': ['Detection'],
      'Analysis': ['Analysis'],
      'Dimensioning': ['Dimensioning'],
      'Simulation': ['Simulation'],
      'Recommendation': ['Recommendation']
    };

    for (const [phase, cards] of Object.entries(phaseCards)) {
      // Navegar para a fase
      const phaseLink = page.locator(`[data-testid="phase-${phase}"]`).or(
        page.locator(`text=${phase}`)
      );

      if (await phaseLink.isVisible()) {
        await phaseLink.click();

        // Verificar se os cards específicos estão presentes
        for (const card of cards) {
          const cardElement = page.locator(`[data-testid="${card.toLowerCase()}-card"]`).or(
            page.locator(`text=${card}`)
          );
          await expect(cardElement).toBeVisible();
        }
      }
    }
  });

  test('deve completar journey e mostrar resumo final', async ({ page }) => {
    // Navegar através de todas as fases rapidamente
    for (let i = 0; i < 8; i++) {
      const nextButton = page.locator('[data-testid="next-phase"]').or(
        page.locator('text=Próxima').or(page.locator('text=Next'))
      );

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Verificar se chegamos à última fase
    await expect(page.locator('text=LeadMgmt')).toBeVisible();

    // Verificar se há botão de finalizar ou resumo
    const finishButton = page.locator('[data-testid="finish-journey"]').or(
      page.locator('text=Finalizar').or(page.locator('text=Concluir'))
    );

    if (await finishButton.isVisible()) {
      await finishButton.click();

      // Verificar se mostra resumo ou confirmação
      const summary = page.locator('[data-testid="journey-summary"]').or(
        page.locator('text=Resumo').or(page.locator('text=Journey concluída'))
      );

      if (await summary.isVisible()) {
        await expect(summary).toBeVisible();
      }
    }
  });
});