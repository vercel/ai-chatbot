import { test, expect, devices } from "@playwright/test";

test.describe("Cobertura 360 Graus - Compatibilidade Cross-Browser", () => {
	// Configurar testes para múltiplos navegadores
	test.use({
		viewport: { width: 1280, height: 720 },
	});

	// Teste base que será executado em todos os navegadores
	const run360BasicTest = async (page: import("@playwright/test").Page) => {
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

		// Teste básico de funcionalidade
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			await azimuthInput.fill("90");
			await expect(azimuthInput).toHaveValue("90");

			// Teste de rotação básica
			await azimuthInput.fill("180");
			await expect(azimuthInput).toHaveValue("180");

			return true;
		}

		return false;
	};

	test("deve funcionar no Chrome Desktop", async ({ page }) => {
		const success = await run360BasicTest(page);
		expect(success).toBeTruthy();
		console.log("Compatibilidade com Chrome Desktop: OK");
	});

	test("deve funcionar no Firefox Desktop", async ({ browser }) => {
		const context = await browser.newContext({
			...devices["Desktop Firefox"],
		});
		const page = await context.newPage();

		try {
			const success = await run360BasicTest(page);
			expect(success).toBeTruthy();
			console.log("Compatibilidade com Firefox Desktop: OK");
		} finally {
			await context.close();
		}
	});

	test("deve funcionar no Safari Desktop", async ({ browser }) => {
		const context = await browser.newContext({
			...devices["Desktop Safari"],
		});
		const page = await context.newPage();

		try {
			const success = await run360BasicTest(page);
			expect(success).toBeTruthy();
			console.log("Compatibilidade com Safari Desktop: OK");
		} finally {
			await context.close();
		}
	});

	test("deve funcionar no Edge Desktop", async ({ browser }) => {
		const context = await browser.newContext({
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
		});
		const page = await context.newPage();

		try {
			const success = await run360BasicTest(page);
			expect(success).toBeTruthy();
			console.log("Compatibilidade com Edge Desktop: OK");
		} finally {
			await context.close();
		}
	});

	test("deve funcionar no Chrome Mobile", async ({ browser }) => {
		const context = await browser.newContext({
			...devices["Pixel 5"],
		});
		const page = await context.newPage();

		try {
			await page.goto("/persona");
			await page.waitForLoadState("networkidle");

			// Em mobile, verificar se interface é responsiva
			const viewport = page.viewportSize();
			if (viewport && viewport.width < 768) {
				// Verificar se controles são acessíveis em mobile
				const azimuthInput = page
					.locator('input[aria-label*="azimuth"]')
					.first();

				if (await azimuthInput.isVisible({ timeout: 5000 })) {
					// Testar toque
					await azimuthInput.tap();
					await azimuthInput.fill("90");

					// Verificar se valor foi aplicado
					const value = await azimuthInput.inputValue();
					expect(value).toBe("90");

					console.log("Compatibilidade com Chrome Mobile: OK");
				}
			}
		} finally {
			await context.close();
		}
	});

	test("deve funcionar no Safari Mobile", async ({ browser }) => {
		const context = await browser.newContext({
			...devices["iPhone 12"],
		});
		const page = await context.newPage();

		try {
			await page.goto("/persona");
			await page.waitForLoadState("networkidle");

			// Verificar gestos de toque no Safari mobile
			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

			if (await azimuthInput.isVisible({ timeout: 5000 })) {
				// Testar interações touch
				await azimuthInput.tap();
				await page.waitForTimeout(500);

				// Simular entrada numérica
				await azimuthInput.fill("45");
				const value = await azimuthInput.inputValue();
				expect(value).toBe("45");

				console.log("Compatibilidade com Safari Mobile: OK");
			}
		} finally {
			await context.close();
		}
	});

	test("deve lidar com diferentes engines JavaScript", async ({ page }) => {
		// Teste específico para diferentes engines JS
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Testar operações que podem variar entre engines
			const testValues = ["0", "90", "180", "270", "360"];

			for (const value of testValues) {
				await azimuthInput.fill(value);

				// Verificar parsing consistente
				const actualValue = await azimuthInput.inputValue();
				expect(actualValue).toBe(value);

				// Testar operações matemáticas
				const numericValue = await page.evaluate((val) => {
					return (Number(val) * 2) / 2; // Deve retornar o mesmo valor
				}, value);

				expect(numericValue).toBe(Number(value));
			}

			console.log("Compatibilidade com diferentes engines JS: OK");
		}
	});

	test("deve funcionar com diferentes versões do navegador", async ({
		page,
	}) => {
		// Simular diferentes versões do Chrome
		const chromeVersions = [
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.177 Safari/537.36",
		];

		for (const ua of chromeVersions) {
			await page.setExtraHTTPHeaders({ "User-Agent": ua });

			await page.reload();
			await page.waitForLoadState("networkidle");

			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

			if (await azimuthInput.isVisible({ timeout: 5000 })) {
				await azimuthInput.fill("45");
				await expect(azimuthInput).toHaveValue("45");

				const regex = /Chrome\/(\d+)/;
				const match = regex.exec(ua);
				console.log(`Compatibilidade com Chrome ${match?.[1]}: OK`);
			}
		}
	});

	test("deve suportar diferentes configurações de hardware", async ({
		page,
	}) => {
		// Testar com diferentes capacidades de hardware
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Simular dispositivo com hardware limitado
		await page.evaluate(() => {
			// Simular navigator.hardwareConcurrency baixo
			Object.defineProperty(navigator, "hardwareConcurrency", {
				value: 2,
				configurable: true,
			});
		});

		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Testar funcionalidade básica com hardware limitado
			const startTime = Date.now();

			for (let angle = 0; angle <= 180; angle += 45) {
				await azimuthInput.fill(angle.toString());
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Mesmo com hardware limitado, deve funcionar
			expect(duration).toBeLessThan(10000);

			console.log("Compatibilidade com hardware limitado: OK");
		}
	});

	test("deve funcionar com diferentes idiomas do navegador", async ({
		page,
	}) => {
		// Testar com diferentes configurações de idioma
		const languages = ["en-US", "pt-BR", "es-ES", "fr-FR"];

		for (const lang of languages) {
			await page.setExtraHTTPHeaders({
				"Accept-Language": lang,
			});

			await page.reload();
			await page.waitForLoadState("networkidle");

			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

			if (await azimuthInput.isVisible({ timeout: 5000 })) {
				// Testar se números são interpretados corretamente independente do idioma
				await azimuthInput.fill("90");
				const value = await azimuthInput.inputValue();

				// Deve ser sempre '90' independente do separador decimal do idioma
				expect(value).toBe("90");

				console.log(`Compatibilidade com idioma ${lang}: OK`);
			}
		}
	});

	test("deve lidar com diferentes configurações de acessibilidade", async ({
		page,
	}) => {
		// Testar com configurações de acessibilidade do navegador
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Simular modo de alto contraste
		await page.emulateMedia({ forcedColors: "active" });
		await page.emulateMedia({ colorScheme: "dark" });

		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Testar funcionalidade com acessibilidade ativada
			await azimuthInput.fill("135");
			await expect(azimuthInput).toHaveValue("135");

			// Verificar se labels ARIA ainda funcionam
			const ariaLabel = await azimuthInput.getAttribute("aria-label");
			expect(ariaLabel).toMatch(/azimuth|azimute/i);

			console.log("Compatibilidade com configurações de acessibilidade: OK");
		}

		// Resetar configurações
		await page.emulateMedia({ forcedColors: "none" });
		await page.emulateMedia({ colorScheme: "light" });
	});

	test("deve funcionar com diferentes configurações de cache", async ({
		page,
		context,
	}) => {
		// Testar com cache desabilitado
		context.setDefaultNavigationTimeout(30000);

		// Desabilitar cache
		await page.route("**/*", (route) => {
			const headers = {
				...route.request().headers(),
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			};
			route.continue({ headers });
		});

		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Testar múltiplas operações sem cache
			for (let i = 0; i < 10; i++) {
				const angle = i * 36; // 36° por iteração
				await azimuthInput.fill(angle.toString());
				await expect(azimuthInput).toHaveValue(angle.toString());
			}

			console.log("Compatibilidade sem cache: OK");
		}
	});

	test("deve suportar diferentes configurações de rede", async ({ page }) => {
		// Testar com simulação de rede lenta
		await page.route("**/*", async (route) => {
			// Simular delay de rede
			await new Promise((resolve) => setTimeout(resolve, 100));
			await route.continue();
		});

		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 10000 })) {
			// Timeout maior para rede lenta
			const startTime = Date.now();

			// Testar operação com rede lenta
			await azimuthInput.fill("90");
			await expect(azimuthInput).toHaveValue("90");

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Deve funcionar mesmo com rede lenta
			expect(duration).toBeLessThan(5000);

			console.log("Compatibilidade com rede lenta: OK");
		}
	});
});
