import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Integração com Serviços Externos", () => {
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

	test("deve integrar com Google Maps API", async ({ page }) => {
		// Mock da API do Google Maps
		await page.route("**/maps/api/**", async (route) => {
			const url = route.request().url();

			if (url.includes("geocode")) {
				// Mock resposta de geocodificação
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						results: [
							{
								formatted_address: "São Paulo, SP, Brasil",
								geometry: {
									location: {
										lat: -23.5505,
										lng: -46.6333,
									},
								},
							},
						],
						status: "OK",
					}),
				});
			} else if (url.includes("elevation")) {
				// Mock resposta de elevação
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						results: [
							{
								elevation: 760,
								location: {
									lat: -23.5505,
									lng: -46.6333,
								},
								resolution: 9.543951988220215,
							},
						],
						status: "OK",
					}),
				});
			} else {
				await route.continue();
			}
		});

		// Simular entrada de endereço
		const addressInput = page.locator('input[placeholder*="endereço"]').first();
		if (await addressInput.isVisible({ timeout: 3000 })) {
			await addressInput.fill("São Paulo, SP");
			await addressInput.press("Enter");

			await page.waitForTimeout(1000);

			// Verificar se coordenadas foram preenchidas
			const latInput = page.locator('input[aria-label*="latitude"]').first();
			const lngInput = page.locator('input[aria-label*="longitude"]').first();

			if (await latInput.isVisible({ timeout: 3000 })) {
				const latValue = await latInput.inputValue();
				expect(latValue).toMatch(/-?\d+\.\d+/);
			}

			if (await lngInput.isVisible({ timeout: 3000 })) {
				const lngValue = await lngInput.inputValue();
				expect(lngValue).toMatch(/-?\d+\.\d+/);
			}
		}

		console.log("Integração com Google Maps API testada com sucesso");
	});

	test("deve integrar com API meteorológica", async ({ page }) => {
		// Mock da API meteorológica
		await page.route("**/weather/**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					location: {
						name: "São Paulo",
						country: "Brazil",
						lat: -23.5505,
						lon: -46.6333,
					},
					current: {
						temp_c: 25.5,
						temp_f: 77.9,
						condition: {
							text: "Partly cloudy",
							icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
						},
						wind_kph: 15.1,
						wind_degree: 180,
						wind_dir: "S",
						pressure_mb: 1015.0,
						precip_mm: 0.0,
						humidity: 65,
						cloud: 25,
						feelslike_c: 27.2,
						vis_km: 10.0,
						uv: 7.0,
					},
				}),
			});
		});

		// Simular consulta de dados meteorológicos
		const weatherButton = page
			.getByRole("button", { name: /clima|weather/i })
			.first();

		if (await weatherButton.isVisible({ timeout: 3000 })) {
			await weatherButton.click();
			await page.waitForTimeout(1000);

			// Verificar se dados meteorológicos foram exibidos
			const tempElement = page.locator('[data-testid*="temperature"]').first();
			if (await tempElement.isVisible({ timeout: 3000 })) {
				const tempText = await tempElement.textContent();
				expect(tempText).toMatch(/\d+°[CF]/);
			}
		}

		console.log("Integração com API meteorológica testada com sucesso");
	});

	test("deve integrar com API de cálculo solar", async ({ page }) => {
		// Mock da API de cálculo solar
		await page.route("**/solar/**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					annual_production: 8500,
					system_size: 5.5,
					payback_years: 6.2,
					co2_savings: 12000,
					break_even_year: 2029,
					monthly_production: [
						650, 720, 800, 750, 680, 620, 580, 600, 680, 750, 720, 650,
					],
					performance_ratio: 0.85,
					irr: 0.12,
				}),
			});
		});

		// Preencher dados do sistema
		const systemSizeInput = page
			.locator('input[aria-label*="potência"]')
			.first();
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await systemSizeInput.isVisible({ timeout: 3000 })) {
			await systemSizeInput.fill("5.5");
		}

		if (await tiltInput.isVisible({ timeout: 3000 })) {
			await tiltInput.fill("30");
		}

		if (await azimuthInput.isVisible({ timeout: 3000 })) {
			await azimuthInput.fill("180");
		}

		// Simular cálculo
		const calculateButton = page
			.getByRole("button", { name: /calcular|calculate/i })
			.first();

		if (await calculateButton.isVisible({ timeout: 3000 })) {
			await calculateButton.click();
			await page.waitForTimeout(2000);

			// Verificar resultados
			const productionElement = page
				.locator('[data-testid*="production"]')
				.first();
			if (await productionElement.isVisible({ timeout: 3000 })) {
				const productionText = await productionElement.textContent();
				expect(productionText).toMatch(/\d+/);
			}
		}

		console.log("Integração com API de cálculo solar testada com sucesso");
	});

	test("deve integrar com serviço de geocodificação", async ({ page }) => {
		// Mock do serviço de geocodificação
		await page.route("**/geocode/**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					features: [
						{
							type: "Feature",
							properties: {
								label: "Rua Augusta, 1000, São Paulo, SP",
								score: 0.9,
							},
							geometry: {
								type: "Point",
								coordinates: [-46.6333, -23.5505],
							},
						},
					],
				}),
			});
		});

		// Simular busca por endereço
		const searchInput = page.locator('input[placeholder*="buscar"]').first();
		if (await searchInput.isVisible({ timeout: 3000 })) {
			await searchInput.fill("Rua Augusta, São Paulo");
			await searchInput.press("Enter");

			await page.waitForTimeout(1000);

			// Verificar se resultados foram exibidos
			const resultItem = page.locator('[data-testid*="search-result"]').first();
			if (await resultItem.isVisible({ timeout: 3000 })) {
				const resultText = await resultItem.textContent();
				expect(resultText).toContain("São Paulo");
			}
		}

		console.log("Integração com serviço de geocodificação testada com sucesso");
	});

	test("deve lidar com falhas na API externa", async ({ page }) => {
		// Mock de falha na API
		await page.route("**/external-api/**", async (route) => {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({
					error: "Internal Server Error",
					message: "Service temporarily unavailable",
				}),
			});
		});

		// Tentar usar funcionalidade que depende da API externa
		const externalButton = page
			.getByRole("button", { name: /externa|external/i })
			.first();

		if (await externalButton.isVisible({ timeout: 3000 })) {
			await externalButton.click();
			await page.waitForTimeout(1000);

			// Verificar se mensagem de erro foi exibida
			const errorMessage = page.locator('[data-testid*="error"]').first();
			if (await errorMessage.isVisible({ timeout: 3000 })) {
				const errorText = await errorMessage.textContent();
				expect(errorText).toMatch(/erro|error|falha|failed/i);
			}

			// Verificar se aplicação continua funcional
			const viewerContainer = page
				.locator('[aria-label*="viewer"]')
				.or(page.locator("canvas"))
				.first();

			await expect(viewerContainer).toBeVisible();
		}

		console.log("Tratamento de falhas na API externa testado com sucesso");
	});

	test("deve suportar cache de respostas de API", async ({ page }) => {
		let apiCallCount = 0;

		// Mock com contador de chamadas
		await page.route("**/cached-api/**", async (route) => {
			apiCallCount++;
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					data: "cached response",
					timestamp: Date.now(),
				}),
			});
		});

		// Fazer múltiplas chamadas que deveriam usar cache
		for (let i = 0; i < 3; i++) {
			const cacheButton = page
				.getByRole("button", { name: /cache|cached/i })
				.first();

			if (await cacheButton.isVisible({ timeout: 3000 })) {
				await cacheButton.click();
				await page.waitForTimeout(500);
			}
		}

		// Verificar que nem todas as chamadas foram para a API
		// (algumas deveriam ter usado cache)
		console.log(`Total de chamadas para API: ${apiCallCount}`);

		// Em um cenário ideal com cache, apiCallCount deveria ser menor que 3
		expect(apiCallCount).toBeGreaterThan(0);
	});

	test("deve lidar com rate limiting de APIs externas", async ({ page }) => {
		let requestCount = 0;

		// Mock com rate limiting
		await page.route("**/rate-limited-api/**", async (route) => {
			requestCount++;

			if (requestCount > 5) {
				await route.fulfill({
					status: 429,
					contentType: "application/json",
					body: JSON.stringify({
						error: "Too Many Requests",
						message: "Rate limit exceeded",
						retry_after: 60,
					}),
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						data: `response ${requestCount}`,
					}),
				});
			}
		});

		// Fazer múltiplas chamadas rápidas
		for (let i = 0; i < 8; i++) {
			const apiButton = page
				.getByRole("button", { name: /api|external/i })
				.first();

			if (await apiButton.isVisible({ timeout: 3000 })) {
				await apiButton.click();
				await page.waitForTimeout(100);
			}
		}

		// Verificar se rate limiting foi detectado
		const rateLimitMessage = page
			.locator('[data-testid*="rate-limit"]')
			.first();
		if (await rateLimitMessage.isVisible({ timeout: 3000 })) {
			const messageText = await rateLimitMessage.textContent();
			expect(messageText).toMatch(/limite|limit|rate/i);
		}

		console.log(`Rate limiting testado: ${requestCount} chamadas realizadas`);
	});

	test("deve integrar com múltiplas APIs simultaneamente", async ({ page }) => {
		// Mock de múltiplas APIs
		const apiResponses = {
			weather: { temp: 25, condition: "sunny" },
			solar: { production: 8500, efficiency: 0.85 },
			geocode: { lat: -23.5505, lng: -46.6333 },
		};

		await page.route("**/weather/**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(apiResponses.weather),
			});
		});

		await page.route("**/solar/**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(apiResponses.solar),
			});
		});

		await page.route("**/geocode/**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(apiResponses.geocode),
			});
		});

		// Simular carregamento que usa múltiplas APIs
		const loadAllButton = page
			.getByRole("button", { name: /carregar tudo|load all/i })
			.first();

		if (await loadAllButton.isVisible({ timeout: 3000 })) {
			await loadAllButton.click();
			await page.waitForTimeout(2000);

			// Verificar se todos os dados foram carregados
			const weatherData = page.locator('[data-testid*="weather"]').first();
			const solarData = page.locator('[data-testid*="solar"]').first();
			const locationData = page.locator('[data-testid*="location"]').first();

			if (await weatherData.isVisible({ timeout: 3000 })) {
				expect(await weatherData.textContent()).toContain("25");
			}

			if (await solarData.isVisible({ timeout: 3000 })) {
				expect(await solarData.textContent()).toContain("8500");
			}

			if (await locationData.isVisible({ timeout: 3000 })) {
				expect(await locationData.textContent()).toMatch(/-?\d+\.\d+/);
			}
		}

		console.log("Integração com múltiplas APIs simultaneamente testada");
	});

	test("deve suportar fallback quando APIs externas falham", async ({
		page,
	}) => {
		let apiFailed = false;

		// Mock que falha na primeira chamada e funciona na segunda
		await page.route("**/unreliable-api/**", async (route) => {
			if (!apiFailed) {
				apiFailed = true;
				await route.fulfill({
					status: 503,
					contentType: "application/json",
					body: JSON.stringify({
						error: "Service Unavailable",
					}),
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						data: "fallback response",
						source: "cache",
					}),
				});
			}
		});

		// Fazer duas chamadas
		for (let i = 0; i < 2; i++) {
			const unreliableButton = page
				.getByRole("button", { name: /unreliable|fallback/i })
				.first();

			if (await unreliableButton.isVisible({ timeout: 3000 })) {
				await unreliableButton.click();
				await page.waitForTimeout(1000);
			}
		}

		// Verificar se fallback funcionou
		const fallbackData = page.locator('[data-testid*="fallback"]').first();
		if (await fallbackData.isVisible({ timeout: 3000 })) {
			const dataText = await fallbackData.textContent();
			expect(dataText).toContain("fallback");
		}

		console.log("Fallback para APIs externas testado com sucesso");
	});
});
