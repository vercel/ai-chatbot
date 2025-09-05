import { test, expect } from '@playwright/test';
import path from 'node:path';

const filePath = path.resolve(__dirname, '../fixtures/bill.csv');

test('upload bill populates cards', async ({ page }) => {
  await page.goto('/upload-bill');
  await page.setInputFiles('input[type="file"]', filePath);
  await page.selectOption('select:nth-of-type(1)', 'date');
  await page.selectOption('select:nth-of-type(2)', 'value');
  await page.click('text=Aplicar');
  await expect(page.getByText('Consumo')).toBeVisible();
  await expect(page.getByText('ROI')).toBeVisible();
});
