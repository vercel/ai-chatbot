import { test, expect } from '@playwright/test';

test.describe('Detection Flow', () => {
	test('successful detection with 2 images', async ({ page }) => {
		await page.goto('/journey/detection');

		// Upload images
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles([
			'./tests/fixtures/image1.jpg',
			'./tests/fixtures/image2.jpg',
		]);

		// Click analyze
		await page.click('text=Analisar Telhado');

		// Wait for report
		await page.waitForSelector('text=Relatório de Detecção');

		// Check overlays and metrics
		await expect(page.locator('text=Área do telhado')).toBeVisible();
		await expect(page.locator('text=Painéis detectados')).toBeVisible();

		// Check CTA
		await expect(page.locator('text=Prosseguir para Análise')).toBeVisible();
	});

	test('error on invalid file', async ({ page }) => {
		await page.goto('/journey/detection');

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(['./tests/fixtures/large-file.jpg']); // >8MB

		await expect(page.locator('text=Arquivo muito grande')).toBeVisible();
	});

	test('back to journey', async ({ page }) => {
		await page.goto('/journey/detection');

		// Upload and analyze
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(['./tests/fixtures/image1.jpg']);
		await page.click('text=Analisar Telhado');
		await page.waitForSelector('text=Relatório de Detecção');

		// Click back
		await page.click('text=Voltar para jornada');
		await expect(page).toHaveURL('/journey');
	});
});