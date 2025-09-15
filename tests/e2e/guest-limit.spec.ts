import { test, expect } from '@playwright/test';

test('guest banner appears when limit reached', async ({ page, context }) => {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:3000';
  const url = new URL(base);

  await context.addCookies([
    {
      name: 'guest-message-count',
      value: '20',
      domain: url.hostname,
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  await page.goto('/chat');

  await expect(page.getByText(/Limite diário de convidado atingido/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
    'href',
    expect.stringContaining('/register'),
  );
});
