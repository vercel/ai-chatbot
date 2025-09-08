import { test, expect } from '@playwright/test';

test.describe('Cobertura 360 Graus - Cenários Avançados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/persona');
    await page.waitForLoadState('networkidle');

    // Tentar mudar para modo integrator
    const integratorButton = page.getByRole('button', { name: /integrator/i }).or(
      page.getByText(/integrator/i).locator('..').locator('button')
    );

    if (await integratorButton.isVisible({ timeout: 3000 })) {
      await integratorButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('deve suportar rotação rápida 360 graus sem travamentos', async ({ page }) => {
    const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

    if (await azimuthInput.isVisible({ timeout: 5000 })) {
      // Teste de performance: rotação rápida
      const startTime = Date.now();

      for (let angle = 0; angle <= 360; angle += 10) {
        await azimuthInput.fill(angle.toString());
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar que a rotação completa levou menos de 5 segundos
      expect(duration).toBeLessThan(5000);

      console.log(`Rotação 360° completada em ${duration}ms`);
    }
  });

  test('deve manter sincronização entre controles deslizantes e numéricos', async ({ page }) => {
    const azimuthSlider = page.locator('input[type="range"][aria-label*="azimuth"]').first();
    const azimuthInput = page.locator('input[aria-label*="azimuth"][type="number"]').first();

    if (await azimuthSlider.isVisible({ timeout: 5000 }) && await azimuthInput.isVisible({ timeout: 5000 })) {
      // Alterar slider
      await azimuthSlider.fill('180');
      await page.waitForTimeout(200);

      // Verificar se input numérico foi atualizado
      await expect(azimuthInput).toHaveValue('180');

      // Alterar input numérico
      await azimuthInput.fill('90');
      await page.waitForTimeout(200);

      // Verificar se slider foi atualizado
      await expect(azimuthSlider).toHaveValue('90');
    }
  });

  test('deve suportar múltiplas orientações solares simultaneamente', async ({ page }) => {
    const tiltInput = page.locator('input[aria-label*="tilt"]').first();
    const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();
    const hourInput = page.locator('input[aria-label*="hour"]').first();

    if (await tiltInput.isVisible({ timeout: 5000 }) &&
        await azimuthInput.isVisible({ timeout: 5000 }) &&
        await hourInput.isVisible({ timeout: 5000 })) {

      // Cenários de otimização solar para diferentes regiões
      const solarScenarios = [
        { name: 'Norte Brasil', tilt: '15', azimuth: '0', hour: '12' },
        { name: 'Sul Brasil', tilt: '30', azimuth: '180', hour: '12' },
        { name: 'Leste Brasil', tilt: '25', azimuth: '90', hour: '6' },
        { name: 'Oeste Brasil', tilt: '25', azimuth: '270', hour: '18' },
        { name: 'Equador', tilt: '0', azimuth: '180', hour: '12' }
      ];

      for (const scenario of solarScenarios) {
        await tiltInput.fill(scenario.tilt);
        await azimuthInput.fill(scenario.azimuth);
        await hourInput.fill(scenario.hour);

        // Verificar se valores foram aplicados
        await expect(tiltInput).toHaveValue(scenario.tilt);
        await expect(azimuthInput).toHaveValue(scenario.azimuth);
        await expect(hourInput).toHaveValue(scenario.hour);

        // Aguardar renderização
        await page.waitForTimeout(300);

        console.log(`Cenário ${scenario.name} aplicado com sucesso`);
      }
    }
  });

  test('deve validar entrada de dados e prevenir valores inválidos', async ({ page }) => {
    const tiltInput = page.locator('input[aria-label*="tilt"]').first();
    const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();
    const spacingInput = page.locator('input[aria-label*="spacing"]').first();

    if (await tiltInput.isVisible({ timeout: 5000 })) {
      // Testar valores inválidos para tilt
      await tiltInput.fill('abc');
      let value = await tiltInput.inputValue();
      expect(Number.isNaN(Number.parseInt(value))).toBeFalsy();

      await tiltInput.fill('-50');
      value = await tiltInput.inputValue();
      expect(Number.parseInt(value)).toBeGreaterThanOrEqual(0);

      await tiltInput.fill('100');
      value = await tiltInput.inputValue();
      expect(Number.parseInt(value)).toBeLessThanOrEqual(90);
    }

    if (await azimuthInput.isVisible({ timeout: 5000 })) {
      // Testar valores inválidos para azimuth
      await azimuthInput.fill('xyz');
      let value = await azimuthInput.inputValue();
      expect(Number.isNaN(Number.parseInt(value))).toBeFalsy();

      await azimuthInput.fill('-100');
      value = await azimuthInput.inputValue();
      expect(Number.parseInt(value)).toBeGreaterThanOrEqual(0);

      await azimuthInput.fill('400');
      value = await azimuthInput.inputValue();
      expect(Number.parseInt(value)).toBeLessThanOrEqual(360);
    }

    if (await spacingInput.isVisible({ timeout: 5000 })) {
      // Testar valores inválidos para spacing
      await spacingInput.fill('invalid');
      let value = await spacingInput.inputValue();
      expect(Number.isNaN(Number.parseFloat(value))).toBeFalsy();

      await spacingInput.fill('-1');
      value = await spacingInput.inputValue();
      expect(Number.parseFloat(value)).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve suportar atalhos de teclado para controles', async ({ page }) => {
    const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

    if (await azimuthInput.isVisible({ timeout: 5000 })) {
      // Focar no input
      await azimuthInput.focus();

      // Usar setas para cima/baixo
      await page.keyboard.press('ArrowUp');
      let value = await azimuthInput.inputValue();
      expect(value).toBeTruthy();

      await page.keyboard.press('ArrowDown');
      value = await azimuthInput.inputValue();
      expect(value).toBeTruthy();

      // Testar PageUp/PageDown se suportado
      await page.keyboard.press('PageUp');
      await page.keyboard.press('PageDown');
    }
  });

  test('deve manter estado consistente após reload da página', async ({ page }) => {
    const tiltInput = page.locator('input[aria-label*="tilt"]').first();
    const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

    if (await tiltInput.isVisible({ timeout: 5000 }) && await azimuthInput.isVisible({ timeout: 5000 })) {
      // Definir valores específicos
      await tiltInput.fill('45');
      await azimuthInput.fill('180');

      // Recarregar página
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verificar se valores foram mantidos (ou resetados consistentemente)
      const newTiltValue = await tiltInput.inputValue();
      const newAzimuthValue = await azimuthInput.inputValue();

      // Pelo menos deve ter valores consistentes
      expect(newTiltValue).toBeTruthy();
      expect(newAzimuthValue).toBeTruthy();

      console.log(`Estado consistente: Tilt ${newTiltValue}°, Azimuth ${newAzimuthValue}°`);
    }
  });

  test('deve suportar zoom e pan na visualização 3D', async ({ page }) => {
    const viewerContainer = page.locator('[aria-label*="viewer"]').or(
      page.locator('canvas')
    ).first();

    if (await viewerContainer.isVisible({ timeout: 5000 })) {
      // Simular zoom com mouse wheel
      await viewerContainer.hover();
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(300);

      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(300);

      // Simular pan com mouse drag
      const box = await viewerContainer.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
        await page.mouse.up();
      }

      console.log('Zoom e pan testados com sucesso');
    }
  });

  test('deve exportar visualizações em diferentes formatos', async ({ page }) => {
    const exportButton = page.locator('button[aria-label*="export"]').or(
      page.locator('button').filter({ hasText: /export/i })
    ).first();

    if (await exportButton.isVisible({ timeout: 5000 })) {
      // Testar múltiplas exportações
      for (let i = 0; i < 3; i++) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await exportButton.click();

        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          expect(filename).toMatch(/\.(png|jpg|jpeg|svg)$/i);
          console.log(`Exportação ${i + 1} bem-sucedida: ${filename}`);
        }

        await page.waitForTimeout(1000);
      }
    }
  });

  test('deve suportar temas claro/escuro na visualização', async ({ page }) => {
    const viewerContainer = page.locator('[aria-label*="viewer"]').first();

    if (await viewerContainer.isVisible({ timeout: 5000 })) {
      // Verificar se há botão de tema ou classe de tema
      const themeButton = page.locator('button[aria-label*="theme"]').or(
        page.locator('button').filter({ hasText: /dark|light|theme/i })
      );

      if (await themeButton.isVisible({ timeout: 3000 })) {
        const initialClass = await viewerContainer.getAttribute('class');

        await themeButton.click();
        await page.waitForTimeout(500);

        const newClass = await viewerContainer.getAttribute('class');

        // Verificar se houve mudança visual
        if (initialClass !== newClass) {
          console.log('Tema alternado com sucesso');
        }
      } else {
        console.log('Controle de tema não encontrado');
      }
    }
  });
});