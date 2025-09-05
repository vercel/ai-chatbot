import { test, expect } from '@playwright/test';

// E2E for VersionTimeline component within test-canvas page

/*
Steps:
1. Create a new version and see diff
2. Rollback via Ctrl+Z and redo via Ctrl+Y
3. Navigate via arrows and Enter
4. Branch from an older version
*/

test('version timeline: create, rollback, branch', async ({ page }) => {
  await page.goto('/test-canvas');

  await page.click('#create-version');
  await expect(page.getByTestId('version-0')).toContainText('v2');
  await expect(page.getByTestId('version-0')).toContainText('→');
  await expect(page.getByTestId('current-version')).toHaveText('v2');

  await page.keyboard.press('Control+Z');
  await expect(page.getByTestId('current-version')).toHaveText('v1');

  await page.keyboard.press('Control+Y');
  await expect(page.getByTestId('current-version')).toHaveText('v2');

  await page.getByRole('listbox').focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('current-version')).toHaveText('v1');

  await page.getByTestId('version-1').getByRole('button', { name: /branch/i }).click();
  await expect(page.getByTestId('version-0')).toContainText('v1-b');
  await expect(page.getByTestId('current-version')).toHaveText('v1-b');
});

