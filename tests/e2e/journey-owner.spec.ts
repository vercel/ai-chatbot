import { test, expect } from '@playwright/test';

test.describe('Journey owner flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('persona-mode', 'owner');
    });
  });

  test('shows investigation breadcrumbs and navigates to detection', async ({ page }) => {
    await page.goto('/journey/investigation');

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Jornada');
    await expect(breadcrumb).toContainText('Investigação');

    await expect(page.getByRole('button', { name: 'Ir para Detecção' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir para Detecção' }).click();

    await expect(page).toHaveURL(/\/journey\/detection/);
    await expect(page.getByRole('heading', { name: 'Detecção do Telhado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Precisa de ajuda?' })).toBeVisible();
  });

  test('dimensioning page exposes support link for owner', async ({ page }) => {
    await page.goto('/journey/dimensioning');

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Dimensionamento');
    await expect(page.getByRole('heading', { name: 'Dimensionamento do Sistema FV' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Precisa de ajuda?' })).toBeVisible();
  });
});
