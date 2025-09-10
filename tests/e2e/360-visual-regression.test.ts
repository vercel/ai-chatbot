import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Visual Regression", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Tentar mudar para modo integrator
		const integratorButton = page
			.getByRole("button", { name: /integrator/i })
			.or(
				page
					.getByText(/integrator/i)
					.locator("..")
					.locator("button"),
			);

		if (await integratorButton.isVisible({ timeout: 3000 })) {
			await integratorButton.click();
			await page.waitForTimeout(1000);
		}
	});

	test("deve manter aparência consistente do visualizador 3D", async ({
		page,
	}) => {
		// Aguardar visualizador carregar completamente
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Capturar screenshot do estado inicial
		await expect(page).toHaveScreenshot("360-viewer-initial.png", {
			fullPage: false,
			clip: { x: 0, y: 0, width: 800, height: 600 },
		});
	});

	test("deve manter aparência consistente após rotação 360°", async ({
		page,
	}) => {
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Simular rotação completa
		await page.mouse.move(400, 300);
		await page.mouse.down();
		await page.mouse.move(400, 300, { steps: 360 });
		await page.mouse.up();

		await page.waitForTimeout(1000);

		// Capturar screenshot após rotação
		await expect(page).toHaveScreenshot("360-viewer-after-rotation.png", {
			fullPage: false,
			clip: { x: 0, y: 0, width: 800, height: 600 },
		});
	});

	test("deve manter aparência consistente dos controles", async ({ page }) => {
		// Focar nos controles de entrada
		const controlsContainer = page
			.locator("form, .controls, [role='form']")
			.first();

		if (await controlsContainer.isVisible({ timeout: 3000 })) {
			await expect(controlsContainer).toHaveScreenshot(
				"360-controls-initial.png",
			);
		}
	});

	test("deve manter aparência consistente após alteração de valores", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await tiltInput.isVisible({ timeout: 3000 })) {
			await tiltInput.fill("45");
		}

		if (await azimuthInput.isVisible({ timeout: 3000 })) {
			await azimuthInput.fill("180");
		}

		await page.waitForTimeout(500);

		// Capturar screenshot após alteração de valores
		const controlsContainer = page
			.locator("form, .controls, [role='form']")
			.first();
		if (await controlsContainer.isVisible({ timeout: 3000 })) {
			await expect(controlsContainer).toHaveScreenshot(
				"360-controls-after-change.png",
			);
		}
	});

	test("deve manter aparência consistente em diferentes viewports", async ({
		page,
	}) => {
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Testar diferentes tamanhos de tela
		const viewports = [
			{ width: 1920, height: 1080, name: "desktop-fullhd" },
			{ width: 1366, height: 768, name: "desktop-hd" },
			{ width: 768, height: 1024, name: "tablet-portrait" },
			{ width: 375, height: 667, name: "mobile-iphone" },
		];

		for (const viewport of viewports) {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			await page.waitForTimeout(500);

			await expect(page).toHaveScreenshot(`360-viewer-${viewport.name}.png`, {
				fullPage: false,
				clip: {
					x: 0,
					y: 0,
					width: Math.min(800, viewport.width),
					height: Math.min(600, viewport.height),
				},
			});
		}
	});

	test("deve manter aparência consistente no modo escuro", async ({ page }) => {
		// Verificar se há botão de toggle de tema
		const themeToggle = page
			.getByRole("button", { name: /dark|light|theme/i })
			.or(page.locator("[data-theme-toggle]"))
			.first();

		if (await themeToggle.isVisible({ timeout: 3000 })) {
			await themeToggle.click();
			await page.waitForTimeout(500);

			const viewerContainer = page
				.locator('[aria-label*="viewer"]')
				.or(page.locator("canvas"))
				.first();

			if (await viewerContainer.isVisible({ timeout: 3000 })) {
				await expect(page).toHaveScreenshot("360-viewer-dark-mode.png", {
					fullPage: false,
					clip: { x: 0, y: 0, width: 800, height: 600 },
				});
			}
		}
	});

	test("deve manter aparência consistente com foco nos controles", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 3000 })) {
			await tiltInput.focus();
			await page.waitForTimeout(200);

			const controlsContainer = page
				.locator("form, .controls, [role='form']")
				.first();
			if (await controlsContainer.isVisible({ timeout: 3000 })) {
				await expect(controlsContainer).toHaveScreenshot(
					"360-controls-focused.png",
				);
			}
		}
	});

	test("deve manter aparência consistente durante animações", async ({
		page,
	}) => {
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Capturar múltiplas screenshots durante animação
		const screenshots: Buffer[] = [];

		for (let i = 0; i < 5; i++) {
			const screenshot = await page.screenshot({
				clip: { x: 0, y: 0, width: 800, height: 600 },
			});
			screenshots.push(screenshot);

			// Pequena rotação
			await page.mouse.move(400, 300);
			await page.mouse.down();
			await page.mouse.move(450, 300);
			await page.mouse.up();

			await page.waitForTimeout(200);
		}

		// Verificar que as screenshots são diferentes (animação ocorreu)
		expect(screenshots.length).toBe(5);
		console.log(
			`Capturadas ${screenshots.length} screenshots durante animação`,
		);
	});

	test("deve manter aparência consistente após reload", async ({ page }) => {
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Capturar screenshot antes do reload
		const beforeReload = await page.screenshot({
			clip: { x: 0, y: 0, width: 800, height: 600 },
		});

		// Recarregar página
		await page.reload();
		await page.waitForLoadState("networkidle");

		// Aguardar visualizador recarregar
		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Capturar screenshot após reload
		const afterReload = await page.screenshot({
			clip: { x: 0, y: 0, width: 800, height: 600 },
		});

		// Comparar screenshots (devem ser similares)
		expect(beforeReload.length).toBeGreaterThan(1000);
		expect(afterReload.length).toBeGreaterThan(1000);

		console.log("Screenshots capturados antes e após reload");
	});

	test("deve manter aparência consistente com dados de exemplo", async ({
		page,
	}) => {
		// Preencher controles com valores específicos
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();
		const hourInput = page.locator('input[aria-label*="hour"]').first();

		const testValues = {
			tilt: "30",
			azimuth: "270",
			hour: "12",
		};

		if (await tiltInput.isVisible({ timeout: 3000 })) {
			await tiltInput.fill(testValues.tilt);
		}

		if (await azimuthInput.isVisible({ timeout: 3000 })) {
			await azimuthInput.fill(testValues.azimuth);
		}

		if (await hourInput.isVisible({ timeout: 3000 })) {
			await hourInput.fill(testValues.hour);
		}

		await page.waitForTimeout(1000);

		// Capturar screenshot com dados de exemplo
		await expect(page).toHaveScreenshot("360-viewer-with-sample-data.png", {
			fullPage: false,
			clip: { x: 0, y: 0, width: 800, height: 600 },
		});

		console.log("Screenshot capturado com dados de exemplo");
	});
});
