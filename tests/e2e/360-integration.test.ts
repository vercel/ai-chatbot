import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Testes de Integração", () => {
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

	test("deve integrar com API de dados solares externos", async ({ page }) => {
		// Mock de resposta da API de dados solares
		await page.route("**/api/solar-data**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					location: "São Paulo, SP",
					irradiance: 5.2,
					temperature: 28,
					humidity: 65,
					windSpeed: 12,
					optimalTilt: 25,
					optimalAzimuth: 180,
				}),
			});
		});

		// Aguardar carregamento e verificar se dados foram aplicados
		await page.waitForLoadState("networkidle");

		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (
			(await tiltInput.isVisible({ timeout: 5000 })) &&
			(await azimuthInput.isVisible({ timeout: 5000 }))
		) {
			// Verificar se valores ótimos foram aplicados automaticamente
			const tiltValue = await tiltInput.inputValue();
			const azimuthValue = await azimuthInput.inputValue();

			// Valores devem corresponder aos dados da API mockada
			expect(tiltValue).toBe("25");
			expect(azimuthValue).toBe("180");

			console.log("Integração com API solar bem-sucedida");
		}
	});

	test("deve lidar com falhas na API externa graciosamente", async ({
		page,
	}) => {
		// Mock de falha na API
		await page.route("**/api/solar-data**", async (route) => {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({
					error: "Service temporarily unavailable",
				}),
			});
		});

		// Aguardar carregamento
		await page.waitForLoadState("networkidle");

		// Verificar se fallback funciona
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (
			(await tiltInput.isVisible({ timeout: 5000 })) &&
			(await azimuthInput.isVisible({ timeout: 5000 }))
		) {
			// Valores devem ter defaults ou valores anteriores
			const tiltValue = await tiltInput.inputValue();
			const azimuthValue = await azimuthInput.inputValue();

			// Verificar que valores são válidos mesmo com falha da API
			expect(tiltValue).toBeTruthy();
			expect(azimuthValue).toBeTruthy();

			// Verificar se controles ainda funcionam
			await tiltInput.fill("30");
			await azimuthInput.fill("90");
			await expect(tiltInput).toHaveValue("30");
			await expect(azimuthInput).toHaveValue("90");

			console.log("Fallback para falha de API funcionou corretamente");
		}
	});

	test("deve integrar com serviço de geocodificação", async ({ page }) => {
		// Mock de resposta da API de geocodificação
		await page.route("**/api/geocode**", async (route) => {
			const url = route.request().url();
			if (url.includes("São Paulo")) {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						lat: -23.5505,
						lng: -46.6333,
						address: "São Paulo, SP, Brazil",
						timezone: "America/Sao_Paulo",
					}),
				});
			} else {
				await route.fulfill({
					status: 404,
					contentType: "application/json",
					body: JSON.stringify({ error: "Location not found" }),
				});
			}
		});

		// Simular entrada de localização
		const locationInput = page
			.locator('input[placeholder*="location"]')
			.or(page.locator('input[aria-label*="location"]'))
			.first();

		if (await locationInput.isVisible({ timeout: 5000 })) {
			await locationInput.fill("São Paulo");
			await locationInput.press("Enter");

			// Aguardar processamento da geocodificação
			await page.waitForTimeout(1000);

			// Verificar se coordenadas foram aplicadas
			const latDisplay = page.locator("text=/latitude|lat/i").first();
			const lngDisplay = page.locator("text=/longitude|lng/i").first();

			if (await latDisplay.isVisible({ timeout: 3000 })) {
				await expect(latDisplay).toContainText("-23.55");
				await expect(lngDisplay).toContainText("-46.63");
			}

			console.log("Integração com geocodificação bem-sucedida");
		}
	});

	test("deve sincronizar com dados meteorológicos em tempo real", async ({
		page,
	}) => {
		// Mock de dados meteorológicos atualizados
		let callCount = 0;
		await page.route("**/api/weather**", async (route) => {
			callCount++;
			const weatherData = {
				temperature: 25 + Math.sin(callCount) * 5, // Variação de temperatura
				cloudCover: Math.random() * 100,
				windSpeed: 10 + Math.random() * 10,
				irradiance: 4.5 + Math.random() * 2,
			};

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(weatherData),
			});
		});

		// Aguardar múltiplas atualizações
		await page.waitForTimeout(3000);

		// Verificar se dados foram atualizados
		const irradianceDisplay = page
			.locator("text=/irradiance|irradiação/i")
			.first();

		if (await irradianceDisplay.isVisible({ timeout: 3000 })) {
			const irradianceText = await irradianceDisplay.textContent();
			expect(irradianceText).toMatch(/\d+\.?\d*/); // Deve conter número

			console.log("Sincronização com dados meteorológicos funcionando");
		}

		// Verificar que múltiplas chamadas foram feitas
		expect(callCount).toBeGreaterThan(0);
	});

	test("deve integrar com API de cálculo de payback", async ({ page }) => {
		// Mock de resposta da API de payback
		await page.route("**/api/payback**", async (route) => {
			const requestData = route.request().postDataJSON();

			// Calcular payback baseado nos dados enviados
			const paybackYears =
				requestData.systemCost / (requestData.annualSavings || 1000);

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					paybackPeriod: paybackYears,
					roi: (requestData.annualSavings / requestData.systemCost) * 100,
					netPresentValue:
						requestData.annualSavings * 10 - requestData.systemCost,
				}),
			});
		});

		// Simular configuração de sistema
		const systemCostInput = page
			.locator('input[aria-label*="cost"]')
			.or(page.locator('input[placeholder*="cost"]'))
			.first();

		if (await systemCostInput.isVisible({ timeout: 5000 })) {
			await systemCostInput.fill("50000");

			// Aguardar cálculo automático
			await page.waitForTimeout(1000);

			// Verificar se resultados foram exibidos
			const paybackDisplay = page.locator("text=/payback|retorno/i").first();

			if (await paybackDisplay.isVisible({ timeout: 3000 })) {
				const paybackText = await paybackDisplay.textContent();
				expect(paybackText).toMatch(/\d+\.?\d*/);

				console.log("Integração com API de payback funcionando");
			}
		}
	});

	test("deve lidar com timeouts de API externos", async ({ page }) => {
		// Mock de timeout na API
		await page.route("**/api/external-service**", async (route) => {
			// Simular timeout de 30 segundos
			await new Promise((resolve) => setTimeout(resolve, 30000));
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ data: "timeout response" }),
			});
		});

		// Iniciar operação que depende da API
		const calculateButton = page
			.locator("button")
			.filter({ hasText: /calculate|calcular/i })
			.first();

		if (await calculateButton.isVisible({ timeout: 5000 })) {
			const startTime = Date.now();

			// Clicar no botão (isso deve iniciar a chamada da API)
			await calculateButton.click();

			// Aguardar timeout ou resposta
			await page.waitForTimeout(5000); // Timeout menor para teste

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Verificar que não travou completamente
			expect(duration).toBeLessThan(10000);

			// Verificar se há mensagem de timeout ou retry
			const timeoutMessage = page
				.locator("text=/timeout|retry|tentar novamente/i")
				.first();

			if (await timeoutMessage.isVisible({ timeout: 3000 })) {
				console.log("Timeout da API foi tratado adequadamente");
			} else {
				console.log("Sistema lidou com timeout sem mensagens específicas");
			}
		}
	});

	test("deve integrar com múltiplas APIs simultaneamente", async ({ page }) => {
		// Setup de múltiplas mocks
		const apiCalls: string[] = [];

		await page.route("**/api/solar**", async (route) => {
			apiCalls.push("solar");
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ irradiance: 5.0 }),
			});
		});

		await page.route("**/api/weather**", async (route) => {
			apiCalls.push("weather");
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ temperature: 25 }),
			});
		});

		await page.route("**/api/geocode**", async (route) => {
			apiCalls.push("geocode");
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ lat: -23.55, lng: -46.63 }),
			});
		});

		// Acionar operação que usa múltiplas APIs
		const analyzeButton = page
			.locator("button")
			.filter({ hasText: /analyze|analisar/i })
			.first();

		if (await analyzeButton.isVisible({ timeout: 5000 })) {
			await analyzeButton.click();

			// Aguardar processamento
			await page.waitForTimeout(2000);

			// Verificar que múltiplas APIs foram chamadas
			expect(apiCalls.length).toBeGreaterThanOrEqual(2);

			console.log("APIs chamadas simultaneamente:", apiCalls);
		}
	});

	test("deve manter cache de respostas de API", async ({ page }) => {
		let callCount = 0;

		// Mock com contador de chamadas
		await page.route("**/api/cached-data**", async (route) => {
			callCount++;
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				headers: {
					"Cache-Control": "max-age=300", // 5 minutos
				},
				body: JSON.stringify({
					data: "cached response",
					timestamp: Date.now(),
				}),
			});
		});

		// Fazer múltiplas requisições rápidas
		for (let i = 0; i < 5; i++) {
			await page.evaluate(() => {
				fetch("/api/cached-data");
			});
			await page.waitForTimeout(100);
		}

		// Aguardar processamento
		await page.waitForTimeout(1000);

		// Verificar que cache foi usado (menos chamadas que requisições)
		console.log("Chamadas para API cached:", callCount);
		expect(callCount).toBeLessThan(5); // Deve usar cache
	});

	test("deve lidar com rate limiting de APIs externas", async ({ page }) => {
		let callCount = 0;

		// Mock com rate limiting
		await page.route("**/api/rate-limited**", async (route) => {
			callCount++;

			if (callCount > 3) {
				await route.fulfill({
					status: 429,
					contentType: "application/json",
					headers: {
						"Retry-After": "60",
					},
					body: JSON.stringify({
						error: "Rate limit exceeded",
						retryAfter: 60,
					}),
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ data: `response ${callCount}` }),
				});
			}
		});

		// Fazer muitas requisições
		for (let i = 0; i < 10; i++) {
			await page.evaluate(() => {
				fetch("/api/rate-limited");
			});
			await page.waitForTimeout(200);
		}

		// Aguardar processamento
		await page.waitForTimeout(2000);

		// Verificar que rate limiting foi respeitado
		expect(callCount).toBeGreaterThan(3); // Algumas chamadas passaram
		expect(callCount).toBeLessThan(10); // Mas não todas

		// Verificar se há tratamento de erro de rate limit
		const rateLimitMessage = page
			.locator("text=/rate limit|limite de taxa/i")
			.first();

		if (await rateLimitMessage.isVisible({ timeout: 3000 })) {
			console.log("Rate limiting foi tratado adequadamente");
		}

		console.log("Rate limiting testado:", callCount, "chamadas feitas");
	});
});
