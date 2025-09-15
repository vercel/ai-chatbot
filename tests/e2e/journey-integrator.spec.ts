import { test, expect } from '@playwright/test';

test.describe('Journey integrator experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('persona-mode', 'integrator');
    });
  });

  test('persona page reveals integrator modules', async ({ page }) => {
    await page.goto('/persona');

    await expect(page.getByText('Pricing Rules')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run Batch' })).toBeVisible();

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/journey\/investigation/);
  });

  test('simulation phase CTA directs to recommendation', async ({ page }) => {
    await page.goto('/journey/simulation');

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Simulação');
    await expect(page.getByRole('button', { name: 'Ir para Recomendação' })).toBeVisible();
  });
});
