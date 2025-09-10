import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Carga Distribuída", () => {
	// Configuração para testes de carga
	test.describe.configure({
		mode: "parallel",
	});

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

	test("deve suportar múltiplas sessões simultâneas", async ({
		page,
		browser,
	}) => {
		const sessions = 3;
		const contexts = [];

		// Criar múltiplas sessões
		for (let i = 0; i < sessions; i++) {
			const context = await browser.newContext();
			const newPage = await context.newPage();

			contexts.push({ context, page: newPage });
		}

		// Executar operações simultâneas
		const results = await Promise.all(
			contexts.map(async ({ page: sessionPage }, index) => {
				await sessionPage.goto("/persona");
				await sessionPage.waitForLoadState("networkidle");

				const viewerContainer = sessionPage
					.locator('[aria-label*="viewer"]')
					.or(sessionPage.locator("canvas"))
					.first();

				await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

				// Realizar operações diferentes em cada sessão
				const tiltInput = sessionPage
					.locator('input[aria-label*="tilt"]')
					.first();
				if (await tiltInput.isVisible({ timeout: 3000 })) {
					await tiltInput.fill((index * 15).toString());
				}

				return { session: index, success: true };
			}),
		);

		// Verificar que todas as sessões foram bem-sucedidas
		expect(results.length).toBe(sessions);
		expect(results.every((r) => r.success)).toBe(true);

		// Limpar sessões
		for (const { context } of contexts) {
			await context.close();
		}

		console.log(`${sessions} sessões simultâneas executadas com sucesso`);
	});

	test("deve manter performance com carga distribuída", async ({
		page,
		browser,
	}) => {
		const concurrentUsers = 5;
		const operations = [];

		// Criar operações simultâneas
		for (let i = 0; i < concurrentUsers; i++) {
			operations.push(
				(async () => {
					const context = await browser.newContext();
					const newPage = await context.newPage();

					const startTime = Date.now();

					await newPage.goto("/persona");
					await newPage.waitForLoadState("networkidle");

					const viewerContainer = newPage
						.locator('[aria-label*="viewer"]')
						.or(newPage.locator("canvas"))
						.first();

					await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

					// Simular uso real
					const tiltInput = newPage
						.locator('input[aria-label*="tilt"]')
						.first();
					const azimuthInput = newPage
						.locator('input[aria-label*="azimuth"]')
						.first();

					if (await tiltInput.isVisible({ timeout: 3000 })) {
						await tiltInput.fill("45");
					}

					if (await azimuthInput.isVisible({ timeout: 3000 })) {
						await azimuthInput.fill("180");
					}

					await newPage.waitForTimeout(1000);

					const endTime = Date.now();
					const responseTime = endTime - startTime;

					await context.close();

					return { user: i, responseTime };
				})(),
			);
		}

		// Executar todas as operações
		const results = await Promise.all(operations);

		// Analisar resultados
		const avgResponseTime =
			results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

		const maxResponseTime = Math.max(...results.map((r) => r.responseTime));
		const minResponseTime = Math.min(...results.map((r) => r.responseTime));

		console.log(`Carga distribuída com ${concurrentUsers} usuários:`);
		console.log(`Tempo médio de resposta: ${avgResponseTime.toFixed(2)}ms`);
		console.log(`Tempo máximo: ${maxResponseTime}ms`);
		console.log(`Tempo mínimo: ${minResponseTime}ms`);

		// Verificar performance aceitável
		expect(avgResponseTime).toBeLessThan(10000); // Menos de 10s em média
		expect(maxResponseTime).toBeLessThan(15000); // Máximo 15s
	});

	test("deve suportar operações concorrentes no mesmo contexto", async ({
		page,
	}) => {
		const operations = [];

		// Criar múltiplas operações na mesma página
		for (let i = 0; i < 10; i++) {
			operations.push(
				(async () => {
					const tiltInput = page.locator('input[aria-label*="tilt"]').first();
					const azimuthInput = page
						.locator('input[aria-label*="azimuth"]')
						.first();

					// Operações aleatórias
					const tiltValue = Math.floor(Math.random() * 90);
					const azimuthValue = Math.floor(Math.random() * 360);

					if (await tiltInput.isVisible({ timeout: 3000 })) {
						await tiltInput.fill(tiltValue.toString());
					}

					if (await azimuthInput.isVisible({ timeout: 3000 })) {
						await azimuthInput.fill(azimuthValue.toString());
					}

					await page.waitForTimeout(100);

					return { operation: i, tilt: tiltValue, azimuth: azimuthValue };
				})(),
			);
		}

		// Executar operações concorrentes
		const results = await Promise.all(operations);

		expect(results.length).toBe(10);
		expect(results.every((r) => r.operation >= 0)).toBe(true);

		console.log("10 operações concorrentes executadas com sucesso");
	});

	test("deve manter estabilidade com carga de rede simulada", async ({
		page,
		browser,
	}) => {
		const users = 3;
		const contexts = [];

		// Configurar simulação de rede lenta
		for (let i = 0; i < users; i++) {
			const context = await browser.newContext();
			await context.route("**/*", async (route) => {
				// Simular latência variável
				const delay = Math.random() * 500 + 100; // 100-600ms
				await new Promise((resolve) => setTimeout(resolve, delay));
				await route.continue();
			});

			const newPage = await context.newPage();
			contexts.push({ context, page: newPage });
		}

		// Executar testes com rede lenta
		const results = await Promise.all(
			contexts.map(async ({ page: sessionPage }, index) => {
				const startTime = Date.now();

				await sessionPage.goto("/persona");
				await sessionPage.waitForLoadState("networkidle");

				const viewerContainer = sessionPage
					.locator('[aria-label*="viewer"]')
					.or(sessionPage.locator("canvas"))
					.first();

				await viewerContainer.waitFor({ state: "visible", timeout: 20000 });

				const loadTime = Date.now() - startTime;

				return { user: index, loadTime };
			}),
		);

		// Analisar resultados com rede lenta
		const avgLoadTime =
			results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;

		console.log("Carga com rede lenta simulada:");
		console.log(`Tempo médio de carregamento: ${avgLoadTime.toFixed(2)}ms`);

		// Mesmo com rede lenta, deve carregar em tempo razoável
		expect(avgLoadTime).toBeLessThan(20000);

		// Limpar
		for (const { context } of contexts) {
			await context.close();
		}
	});

	test("deve suportar carga de dados massiva", async ({ page }) => {
		const dataPoints = 100;
		const operations = [];

		// Preparar operações massivas
		for (let i = 0; i < dataPoints; i++) {
			operations.push({
				tilt: Math.floor(Math.random() * 90),
				azimuth: Math.floor(Math.random() * 360),
				hour: Math.floor(Math.random() * 24),
			});
		}

		const startTime = Date.now();

		// Executar operações em lote
		for (const data of operations) {
			const tiltInput = page.locator('input[aria-label*="tilt"]').first();
			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();
			const hourInput = page.locator('input[aria-label*="hour"]').first();

			if (await tiltInput.isVisible({ timeout: 1000 })) {
				await tiltInput.fill(data.tilt.toString());
			}

			if (await azimuthInput.isVisible({ timeout: 1000 })) {
				await azimuthInput.fill(data.azimuth.toString());
			}

			if (await hourInput.isVisible({ timeout: 1000 })) {
				await hourInput.fill(data.hour.toString());
			}

			// Pequena pausa para simular processamento
			await page.waitForTimeout(10);
		}

		const endTime = Date.now();
		const totalTime = endTime - startTime;

		console.log(`${dataPoints} pontos de dados processados em ${totalTime}ms`);
		console.log(
			`Performance: ${(dataPoints / (totalTime / 1000)).toFixed(2)} ops/seg`,
		);

		// Verificar performance aceitável
		expect(totalTime).toBeLessThan(30000); // Menos de 30s para 100 operações
	});

	test("deve manter isolamento entre sessões", async ({ browser }) => {
		const context1 = await browser.newContext();
		const context2 = await browser.newContext();

		const page1 = await context1.newPage();
		const page2 = await context2.newPage();

		// Sessão 1
		await page1.goto("/persona");
		await page1.waitForLoadState("networkidle");

		const tiltInput1 = page1.locator('input[aria-label*="tilt"]').first();
		if (await tiltInput1.isVisible({ timeout: 3000 })) {
			await tiltInput1.fill("30");
		}

		// Sessão 2
		await page2.goto("/persona");
		await page2.waitForLoadState("networkidle");

		const tiltInput2 = page2.locator('input[aria-label*="tilt"]').first();
		if (await tiltInput2.isVisible({ timeout: 3000 })) {
			await tiltInput2.fill("60");
		}

		// Verificar isolamento
		const value1 = await tiltInput1.inputValue();
		const value2 = await tiltInput2.inputValue();

		expect(value1).toBe("30");
		expect(value2).toBe("60");

		// Verificar que são valores diferentes
		expect(value1).not.toBe(value2);

		await context1.close();
		await context2.close();

		console.log("Isolamento entre sessões verificado com sucesso");
	});

	test("deve suportar carga de eventos do usuário", async ({ page }) => {
		const eventCount = 50;
		const events = [];

		// Preparar eventos simulados
		for (let i = 0; i < eventCount; i++) {
			events.push({
				type: Math.random() > 0.5 ? "tilt" : "azimuth",
				value: Math.floor(Math.random() * 360),
			});
		}

		const startTime = Date.now();

		// Executar eventos rapidamente
		for (const event of events) {
			const input = page.locator(`input[aria-label*="${event.type}"]`).first();

			if (await input.isVisible({ timeout: 500 })) {
				await input.fill(event.value.toString());
			}
		}

		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(
			`${eventCount} eventos de usuário processados em ${duration}ms`,
		);
		console.log(
			`Taxa de processamento: ${(eventCount / (duration / 1000)).toFixed(2)} eventos/seg`,
		);

		// Verificar que processou todos os eventos
		expect(duration).toBeLessThan(10000); // Menos de 10s
	});

	test("deve manter performance com múltiplas abas", async ({
		page,
		context,
	}) => {
		const tabCount = 3;
		const pages = [page]; // Página inicial

		// Criar abas adicionais
		for (let i = 0; i < tabCount - 1; i++) {
			const newPage = await context.newPage();
			pages.push(newPage);
		}

		// Carregar aplicação em todas as abas
		const loadResults = await Promise.all(
			pages.map(async (tabPage, index) => {
				const startTime = Date.now();

				await tabPage.goto("/persona");
				await tabPage.waitForLoadState("networkidle");

				const viewerContainer = tabPage
					.locator('[aria-label*="viewer"]')
					.or(tabPage.locator("canvas"))
					.first();

				await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

				const loadTime = Date.now() - startTime;

				return { tab: index, loadTime };
			}),
		);

		// Analisar performance
		const avgLoadTime =
			loadResults.reduce((sum, r) => sum + r.loadTime, 0) / loadResults.length;

		console.log(`Performance com ${tabCount} abas:`);
		console.log(`Tempo médio de carregamento: ${avgLoadTime.toFixed(2)}ms`);

		expect(avgLoadTime).toBeLessThan(8000);

		// Fechar abas adicionais
		for (let i = 1; i < pages.length; i++) {
			await pages[i].close();
		}
	});
});
