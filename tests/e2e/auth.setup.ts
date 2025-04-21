import path from 'node:path';
import { generateId } from 'ai';
import { getUnixTime } from 'date-fns';
import { expect, test as setup } from '@playwright/test';

const authFile = path.join(__dirname, '../../playwright/.auth/session.json');

setup('authenticate', async ({ page }) => {
  const testEmail = `test-${getUnixTime(new Date())}@playwright.com`;
  const testPassword = generateId(16);

  await page.goto('http://localhost:3000/register');
  await page.getByPlaceholder('user@acme.com').click();
  await page.getByPlaceholder('user@acme.com').fill(testEmail);
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill(testPassword);
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page.getByTestId('toast')).toContainText(
    'Account created successfully!',
  );

  await page.context().storageState({ path: authFile });
});
