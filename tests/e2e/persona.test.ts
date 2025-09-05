import { test, expect } from '@playwright/test';

const SNAPSHOT_PATH = 'persona';

test('persona modes render expected UI', async ({ page }) => {
  await page.goto('/persona');
  await expect(page.getByRole('dialog', { name: 'Guided Wizard' })).toBeVisible();
  expect(await page.textContent('main')).toMatchSnapshot(`${SNAPSHOT_PATH}-owner.txt`);

  await page.getByLabel('Persona Mode').click();
  await page.getByText('Integrator').click();
  await expect(page.getByText('Spec Library')).toBeVisible();
  await expect(page.getByText('Tilt')).toBeVisible();
});
