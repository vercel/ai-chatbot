import { test, expect } from '@playwright/test';

test('upload flow redirects to analysis', async ({ page }) => {
  await page.goto('/upload-bill');

  await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page).toHaveURL(/\/journey\/analysis/);
  await expect(page.getByRole('heading', { name: 'Análise de Viabilidade' })).toBeVisible();
});
