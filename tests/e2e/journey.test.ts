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
  const telemetry = await page.evaluate(() => (window as any).__journey.telemetry);
  for (const name of phases) {
    expect(telemetry[name].start).toBeTruthy();
  }
});

test('journey deviation flow', async ({ page }) => {
  await page.goto('/journey/Investigation');
  await page.click('#skip');
  await expect(page.getByRole('heading', { name: 'Recommendation' })).toBeVisible();
  await page.click('#prev');
  await expect(page.getByRole('heading', { name: 'Dimensioning' })).toBeVisible();
  await page.click('#reset');
  await expect(page.getByRole('heading', { name: 'Investigation' })).toBeVisible();
  const telemetry = await page.evaluate(() => (window as any).__journey.telemetry);
  expect(telemetry.Recommendation.start).toBeTruthy();
  expect(telemetry.Dimensioning.start).toBeTruthy();
});
