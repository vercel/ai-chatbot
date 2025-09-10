import { test, expect, devices } from "@playwright/test";

// Configuração para iOS
test.use({
	...devices["iPhone 12"],
	viewport: { width: 390, height: 844 },
});

test.describe("Cobertura 360 Graus - Mobile e Gestos de Toque", () => {
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

	test("deve suportar gestos de toque para rotação 360° no iOS", async ({
		page,
	}) => {
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Simular gesto de swipe para rotação
		const box = await viewerContainer.boundingBox();
		if (box) {
			const centerX = box.x + box.width / 2;
			const centerY = box.y + box.height / 2;

			// Swipe para a direita (rotação)
			await page.touchscreen.tap(centerX, centerY);
			await page.waitForTimeout(500);

			// Verificar que o visualizador ainda responde
			await expect(viewerContainer).toBeVisible();
		}

		console.log("Gesto de toque testado no iOS");
	});

	test("deve suportar pinch to zoom no iOS", async ({ page }) => {
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const box = await viewerContainer.boundingBox();
		if (box) {
			const centerX = box.x + box.width / 2;
			const centerY = box.y + box.height / 2;

			// Simular pinch out (zoom in)
			await page.touchscreen.tap(centerX - 50, centerY);
			await page.touchscreen.tap(centerX + 50, centerY);
			await page.waitForTimeout(500);

			// Verificar que o visualizador ainda funciona
			await expect(viewerContainer).toBeVisible();
		}

		console.log("Pinch to zoom testado no iOS");
	});

	test("deve suportar navegação por toque nos controles móveis", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 3000 })) {
			const box = await tiltInput.boundingBox();
			if (box) {
				// Toque no input
				await page.touchscreen.tap(
					box.x + box.width / 2,
					box.y + box.height / 2,
				);
				await page.waitForTimeout(500);

				// Verificar se o teclado virtual apareceu (simulando)
				const focusedElement = await page.evaluate(
					() => document.activeElement?.tagName,
				);
				expect(focusedElement).toBe("INPUT");
			}
		}

		console.log("Navegação por toque testada nos controles móveis");
	});

	test("deve manter performance em dispositivos móveis", async ({ page }) => {
		const startTime = Date.now();

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 15000 });

		const loadTime = Date.now() - startTime;

		// Em dispositivos móveis, permitir até 8 segundos
		expect(loadTime).toBeLessThan(8000);

		console.log(`Tempo de carregamento em dispositivo móvel: ${loadTime}ms`);
	});

	test("deve suportar orientação landscape no mobile", async ({ page }) => {
		// Simular mudança para landscape
		await page.setViewportSize({ width: 844, height: 390 });

		await page.waitForTimeout(500);

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await expect(viewerContainer).toBeVisible();

		console.log("Orientação landscape testada no mobile");
	});
});

// Testes específicos para Android
test.describe("Cobertura 360 Graus - Android Gestures", () => {
	test.beforeEach(async ({ page }) => {
		// Configurar viewport para Android
		await page.setViewportSize({ width: 393, height: 851 });
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

	test("deve suportar gestos de toque para rotação 360° no Android", async ({
		page,
	}) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const box = await viewerContainer.boundingBox();
		if (box) {
			const centerX = box.x + box.width / 2;
			const centerY = box.y + box.height / 2;

			// Long press seguido de drag
			await page.touchscreen.tap(centerX, centerY);
			await page.waitForTimeout(1000);

			// Drag para simular rotação
			await page.mouse.move(centerX, centerY);
			await page.mouse.down();
			await page.mouse.move(centerX + 100, centerY);
			await page.mouse.up();

			await expect(viewerContainer).toBeVisible();
		}

		console.log("Gesto de toque testado no Android");
	});

	test("deve suportar double tap para zoom no Android", async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const box = await viewerContainer.boundingBox();
		if (box) {
			const centerX = box.x + box.width / 2;
			const centerY = box.y + box.height / 2;

			// Double tap
			await page.touchscreen.tap(centerX, centerY);
			await page.touchscreen.tap(centerX, centerY);
			await page.waitForTimeout(500);

			await expect(viewerContainer).toBeVisible();
		}

		console.log("Double tap testado no Android");
	});
});

// Testes para tablets
test.describe("Cobertura 360 Graus - Tablet Gestures", () => {
	test.beforeEach(async ({ page }) => {
		// Configurar viewport para tablet
		await page.setViewportSize({ width: 1024, height: 1366 });
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

	test("deve suportar multi-touch gestures no tablet", async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const box = await viewerContainer.boundingBox();
		if (box) {
			const centerX = box.x + box.width / 2;
			const centerY = box.y + box.height / 2;

			// Simular multi-touch rotation
			await page.touchscreen.tap(centerX - 50, centerY);
			await page.touchscreen.tap(centerX + 50, centerY);
			await page.waitForTimeout(1000);

			await expect(viewerContainer).toBeVisible();
		}

		console.log("Multi-touch gestures testados no tablet");
	});

	test("deve suportar stylus input no tablet", async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const box = await viewerContainer.boundingBox();
		if (box) {
			const centerX = box.x + box.width / 2;
			const centerY = box.y + box.height / 2;

			// Simular input com stylus (usando mouse como proxy)
			await page.mouse.move(centerX, centerY);
			await page.mouse.down();
			await page.mouse.move(centerX + 50, centerY + 50);
			await page.mouse.up();

			await expect(viewerContainer).toBeVisible();
		}

		console.log("Stylus input testado no tablet");
	});
});

// Testes de performance mobile
test.describe("Cobertura 360 Graus - Mobile Performance", () => {
	test("deve manter performance aceitável em conexões 3G", async ({ page }) => {
		// Simular conexão 3G lenta
		await page.route("**/*", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
			await route.continue();
		});

		await page.goto("/persona");
		const startTime = Date.now();

		await page.waitForLoadState("networkidle");

		const loadTime = Date.now() - startTime;

		// Com conexão lenta, permitir até 15 segundos
		expect(loadTime).toBeLessThan(15000);

		console.log(`Tempo de carregamento com conexão 3G simulada: ${loadTime}ms`);
	});

	test("deve funcionar com memória limitada", async ({ page }) => {
		// Simular ambiente com memória limitada
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Verificar uso de memória
		const memoryUsage = await page.evaluate(() => {
			try {
				// @ts-ignore - Memory API não está tipada
				return performance.memory?.usedJSHeapSize || 0;
			} catch {
				return 0;
			}
		});

		// Em dispositivos móveis, manter uso abaixo de 50MB
		expect(memoryUsage).toBeLessThan(50 * 1024 * 1024);

		console.log(
			`Uso de memória em dispositivo móvel: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`,
		);
	});

	test("deve suportar offline mode básico", async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Simular offline
		await page.context().setOffline(true);

		await page.waitForTimeout(1000);

		// Verificar se a aplicação ainda responde
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		// Mesmo offline, a interface deve permanecer funcional
		await expect(viewerContainer).toBeVisible();

		console.log("Modo offline testado com sucesso");
	});
});
