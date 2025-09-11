import { test, expect } from '@playwright/test';

test.describe('Analysis Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the analysis page
    await page.goto('/journey/analysis');
  });

  test('should load analysis page for owner persona', async ({ page }) => {
    // Check if we're on the analysis page
    await expect(page).toHaveURL(/.*analysis/);

    // Check for owner-specific elements
    await expect(page.getByText('Dados de Energia')).toBeVisible();
    await expect(page.getByLabel('Consumo mensal médio (kWh)')).toBeVisible();
    await expect(page.getByLabel('Tarifa de energia (R$/kWh)')).toBeVisible();
    await expect(page.getByText('Próximo')).toBeVisible();
  });

  test('should load analysis page for integrator persona', async ({ page }) => {
    // Switch to integrator persona
    await page.getByRole('button', { name: /integrator/i }).click();

    // Check for integrator-specific elements
    await expect(page.getByText('Dados Técnicos de Energia')).toBeVisible();
    await expect(page.getByLabel('Irradiação solar (kWh/kWp/dia)')).toBeVisible();
    await expect(page.getByLabel('Fator de potência')).toBeVisible();
    await expect(page.getByText('Analisar Viabilidade')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Próximo' }).click();

    // Check for validation errors
    await expect(page.getByText(/consumo mensal é obrigatório/i)).toBeVisible();
  });

  test('should accept valid energy input', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Consumo mensal médio (kWh)').fill('500');
    await page.getByLabel('Tarifa de energia (R$/kWh)').fill('0.8');

    // Submit the form
    await page.getByRole('button', { name: 'Próximo' }).click();

    // Should navigate to results or show loading
    await expect(page.getByText(/analisando|carregando/i)).toBeVisible();
  });

  test('should handle file upload for energy bills', async ({ page }) => {
    // Create a sample CSV file content
    const csvContent = `Mês,Consumo kWh
Jan,450
Fev,480
Mar,520
Abr,490
Mai,510
Jun,530
Jul,550
Ago,540
Set,520
Out,500
Nov,480
Dez,460`;

    // Upload the file
    await page.setInputFiles('input[type="file"]', {
      name: 'conta.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Check if consumption field is auto-filled
    await expect(page.getByLabel('Consumo mensal médio (kWh)')).toHaveValue('495');
  });

  test('should display viability results', async ({ page }) => {
    // Fill and submit form
    await page.getByLabel('Consumo mensal médio (kWh)').fill('600');
    await page.getByLabel('Tarifa de energia (R$/kWh)').fill('0.9');
    await page.getByRole('button', { name: 'Próximo' }).click();

    // Wait for results to load
    await page.waitForSelector('[data-testid="viability-results"]');

    // Check for key result elements
    await expect(page.getByText('Relatório de Viabilidade')).toBeVisible();
    await expect(page.getByText(/Economia Anual/i)).toBeVisible();
    await expect(page.getByText(/Payback/i)).toBeVisible();
    await expect(page.getByText(/ROI/i)).toBeVisible();
  });

  test('should show technical details for integrator', async ({ page }) => {
    // Switch to integrator
    await page.getByRole('button', { name: /integrator/i }).click();

    // Fill technical form
    await page.getByLabel('Consumo mensal médio (kWh)').fill('800');
    await page.getByLabel('Tarifa de energia (R$/kWh)').fill('1.0');
    await page.getByLabel('Irradiação solar (kWh/kWp/dia)').fill('5.0');
    await page.getByLabel('Fator de potência').fill('0.95');

    // Submit
    await page.getByRole('button', { name: 'Analisar Viabilidade' }).click();

    // Check for technical results
    await page.waitForSelector('[data-testid="viability-results"]');
    await expect(page.getByText('Análise Técnica de Viabilidade')).toBeVisible();
    await expect(page.getByText(/LCOE/i)).toBeVisible();
    await expect(page.getByText(/NPV/i)).toBeVisible();
  });

  test('should export results', async ({ page }) => {
    // Complete analysis
    await page.getByLabel('Consumo mensal médio (kWh)').fill('400');
    await page.getByLabel('Tarifa de energia (R$/kWh)').fill('0.7');
    await page.getByRole('button', { name: 'Próximo' }).click();

    // Wait for results
    await page.waitForSelector('[data-testid="viability-results"]');

    // Click export button
    await page.getByRole('button', { name: /exportar/i }).click();

    // Should trigger download or show export options
    // Note: Actual download testing would require more complex setup
    await expect(page.getByText(/export/i)).toBeVisible();
  });

  test('should navigate to next phase', async ({ page }) => {
    // Complete analysis
    await page.getByLabel('Consumo mensal médio (kWh)').fill('550');
    await page.getByLabel('Tarifa de energia (R$/kWh)').fill('0.85');
    await page.getByRole('button', { name: 'Próximo' }).click();

    // Wait for results
    await page.waitForSelector('[data-testid="viability-results"]');

    // Click continue to dimensioning
    await page.getByRole('button', { name: 'Continuar para Dimensionamento' }).click();

    // Should navigate to dimensioning phase
    await expect(page).toHaveURL(/.*dimensioning/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure (this would require network interception setup)
    // For now, we'll test the UI error handling

    // Fill form with invalid data that might cause API issues
    await page.getByLabel('Consumo mensal médio (kWh)').fill('0');
    await page.getByLabel('Tarifa de energia (R$/kWh)').fill('0');

    await page.getByRole('button', { name: 'Próximo' }).click();

    // Should show error message or fallback behavior
    await expect(page.getByText(/erro|falha|problema/i)).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Check for ARIA labels and keyboard navigation
    await expect(page.getByLabel('Consumo mensal médio (kWh)')).toBeVisible();
    await expect(page.getByLabel('Tarifa de energia (R$/kWh)')).toBeVisible();

    // Check focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('INPUT');
  });
});