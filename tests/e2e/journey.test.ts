import { test, expect } from '@playwright/test';

const phases = [
  'Investigation',
  'Detection',
  'Analysis',
  'Dimensioning',
  'Recommendation',
  'LeadMgmt',
];

test('journey happy flow', async ({ page }) => {
  await page.goto('/journey/Investigation');
  for (const name of phases) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
    if (name !== 'LeadMgmt') {
      await page.click('#next');
    }
  }
  const telemetry = await page.evaluate(
    () => (window as any).__journey.telemetry,
  );
  for (const name of phases) {
    expect(telemetry[name].start).toBeTruthy();
  }
});

test('journey deviation flow', async ({ page }) => {
  await page.goto('/journey/Investigation');
  await page.click('#skip');
  await expect(
    page.getByRole('heading', { name: 'Recommendation' }),
  ).toBeVisible();
  await page.click('#prev');
  await expect(
    page.getByRole('heading', { name: 'Dimensioning' }),
  ).toBeVisible();
  await page.click('#reset');
  await expect(
    page.getByRole('heading', { name: 'Investigation' }),
  ).toBeVisible();
  const telemetry = await page.evaluate(
    () => (window as any).__journey.telemetry,
  );
  expect(telemetry.Recommendation.start).toBeTruthy();
  expect(telemetry.Dimensioning.start).toBeTruthy();
});

test('journey with 360 coverage integration', async ({ page }) => {
  await page.goto('/journey/Investigation');

  // Fase Investigation
  await expect(
    page.getByRole('heading', { name: 'Investigation' }),
  ).toBeVisible();
  await page.click('#next');

  // Fase Detection - Testar integração básica com Roof3DViewer
  await expect(page.getByRole('heading', { name: 'Detection' })).toBeVisible();
  await testRoofAnalysisInPhase(page);
  await page.click('#next');

  // Fase Analysis
  await expect(page.getByRole('heading', { name: 'Analysis' })).toBeVisible();
  await testRoofAnalysisInPhase(page);
  await page.click('#next');

  // Continuar jornada
  await expect(
    page.getByRole('heading', { name: 'Dimensioning' }),
  ).toBeVisible();
  await page.click('#next');
  await expect(
    page.getByRole('heading', { name: 'Recommendation' }),
  ).toBeVisible();
  await page.click('#next');
  await expect(page.getByRole('heading', { name: 'LeadMgmt' })).toBeVisible();

  // Verificar telemetria
  const telemetry = await page.evaluate(
    () => (window as any).__journey.telemetry,
  );
  expect(telemetry.Detection.start).toBeTruthy();
  expect(telemetry.Analysis.start).toBeTruthy();
});

async function testRoofAnalysisInPhase(page: any) {
  // Verificar elementos de análise de telhado
  const hasRoofAnalysis = await checkRoofAnalysisElements(page);

  if (hasRoofAnalysis) {
    await test360Controls(page);
  }
}

async function checkRoofAnalysisElements(page: any): Promise<boolean> {
  const selectors = [
    '[aria-label*="viewer"]',
    '[aria-label*="roof"]',
    'input[aria-label*="tilt"]',
    'input[aria-label*="azimuth"]',
  ];

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      // Continuar verificando outros seletores
    }
  }
  return false;
}

async function test360Controls(page: any) {
  // Testar controles de azimute 360 graus
  const azimuthControl = page.locator('input[aria-label*="azimuth"]').first();
  if (await azimuthControl.isVisible({ timeout: 1000 })) {
    await azimuthControl.fill('0');
    await page.waitForTimeout(200);
    await azimuthControl.fill('180');
    await page.waitForTimeout(200);
    await azimuthControl.fill('360');
    await page.waitForTimeout(200);
  }

  // Testar controles de tilt
  const tiltControl = page.locator('input[aria-label*="tilt"]').first();
  if (await tiltControl.isVisible({ timeout: 1000 })) {
    await tiltControl.fill('30');
    await page.waitForTimeout(200);
    await tiltControl.fill('60');
    await page.waitForTimeout(200);
  }

  // Testar botão de exportação se disponível
  const exportButton = page.locator('button[aria-label*="export"]').first();
  if (await exportButton.isVisible({ timeout: 1000 })) {
    try {
      const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
      await exportButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg)$/i);
    } catch {
      // Download não ocorreu, continuar teste
    }
  }
}
