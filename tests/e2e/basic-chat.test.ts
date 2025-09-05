import { test, expect } from '@playwright/test';

test('basic flow envio→streaming→actions→pin', async ({ page }) => {
  await page.goto('/test-chat');
  await page.getByLabel('Digite sua mensagem').fill('olá');
  await page.getByLabel('enviar').click();
  await expect(page.getByTestId('conversation-stream')).toContainText('echo: olá');
  const pin = page.getByRole('button', { name: '📌' });
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
});
