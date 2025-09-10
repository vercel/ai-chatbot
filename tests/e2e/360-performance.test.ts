import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Performance e Benchmarking", () => {
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

	test("deve medir tempo de carregamento inicial do visualizador 3D", async ({
		page,
	}) => {
		const startTime = Date.now();

		// Aguardar carregamento completo
		await page.waitForLoadState("networkidle");

		// Aguardar visualizador específico
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const loadTime = Date.now() - startTime;

		// Verificar que carregamento é menor que 5 segundos
		expect(loadTime).toBeLessThan(5000);

		console.log(`Tempo de carregamento do visualizador 3D: ${loadTime}ms`);

		// Medir tempo de primeira renderização
		const firstPaint = await page.evaluate(() => {
			return performance.getEntriesByType("paint")[0]?.startTime || 0;
		});

		if (firstPaint > 0) {
			console.log(`First Paint: ${firstPaint}ms`);
			expect(firstPaint).toBeLessThan(3000);
		}
	});

	test("deve benchmarkar performance de rotação 360° gradual", async ({
		page,
	}) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const rotations = [];
			const step = 10; // graus por passo

			// Medir performance de rotação gradual
			for (let angle = 0; angle <= 360; angle += step) {
				const startTime = Date.now();

				await azimuthInput.fill(angle.toString());
				await page.waitForTimeout(50); // Pequena pausa para renderização

				const endTime = Date.now();
				rotations.push({
					angle,
					duration: endTime - startTime,
				});
			}

			// Calcular métricas de performance
			const totalTime = rotations.reduce((sum, r) => sum + r.duration, 0);
			const avgTime = totalTime / rotations.length;
			const maxTime = Math.max(...rotations.map((r) => r.duration));
			const minTime = Math.min(...rotations.map((r) => r.duration));

			console.log("Performance de rotação 360°:");
			console.log("- Tempo total:", totalTime, "ms");
			console.log("- Tempo médio por passo:", avgTime.toFixed(2), "ms");
			console.log("- Tempo máximo:", maxTime, "ms");
			console.log("- Tempo mínimo:", minTime, "ms");

			// Verificações de performance
			expect(avgTime).toBeLessThan(200); // Menos de 200ms por atualização
			expect(maxTime).toBeLessThan(500); // Máximo 500ms por atualização
			expect(totalTime).toBeLessThan(10000); // Total menos de 10 segundos
		}
	});

	test("deve testar performance de rotação rápida 360°", async ({ page }) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const startTime = Date.now();

			// Rotação rápida sem pausas
			for (let angle = 0; angle <= 360; angle += 5) {
				await azimuthInput.fill(angle.toString());
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log(`Rotação rápida 360° completada em ${duration}ms`);

			// Verificar performance aceitável
			expect(duration).toBeLessThan(3000); // Menos de 3 segundos para rotação completa

			// Verificar que não houve travamentos (input ainda responde)
			await azimuthInput.fill("180");
			await expect(azimuthInput).toHaveValue("180");
		}
	});

	test("deve medir performance de múltiplas atualizações simultâneas", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();
		const hourInput = page.locator('input[aria-label*="hour"]').first();

		if (
			(await tiltInput.isVisible({ timeout: 5000 })) &&
			(await azimuthInput.isVisible({ timeout: 5000 })) &&
			(await hourInput.isVisible({ timeout: 5000 }))
		) {
			const startTime = Date.now();

			// Atualizar todos os controles simultaneamente
			await Promise.all([
				tiltInput.fill("45"),
				azimuthInput.fill("180"),
				hourInput.fill("12"),
			]);

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log(`Atualização simultânea completada em ${duration}ms`);

			// Verificar valores foram aplicados
			await expect(tiltInput).toHaveValue("45");
			await expect(azimuthInput).toHaveValue("180");
			await expect(hourInput).toHaveValue("12");

			// Performance aceitável para atualização simultânea
			expect(duration).toBeLessThan(1000);
		}
	});

	test("deve testar limite de FPS durante animações", async ({ page }) => {
		const azimuthSlider = page
			.locator('input[type="range"][aria-label*="azimuth"]')
			.first();

		if (await azimuthSlider.isVisible({ timeout: 5000 })) {
			// Coletar métricas de performance durante animação
			const performanceEntries: string[] = [];

			page.on("console", (msg) => {
				if (msg.text().includes("FPS") || msg.text().includes("frame")) {
					performanceEntries.push(msg.text());
				}
			});

			const startTime = Date.now();

			// Simular animação rápida
			for (let i = 0; i < 10; i++) {
				await azimuthSlider.fill((i * 36).toString()); // 36° por passo
				await page.waitForTimeout(100);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("Animação de 360° completada em", duration, "ms");
			console.log("Performance entries:", performanceEntries);

			// Verificar que animação foi suave
			expect(duration).toBeLessThan(2000);
		}
	});

	test("deve medir uso de memória durante operações 360°", async ({ page }) => {
		// Medir uso de memória antes das operações
		const initialMemory = await page.evaluate(() => {
			return performance.memory
				? {
						used: performance.memory.usedJSHeapSize,
						total: performance.memory.totalJSHeapSize,
						limit: performance.memory.jsHeapSizeLimit,
					}
				: null;
		});

		if (initialMemory) {
			console.log(
				"Memória inicial:",
				Math.round(initialMemory.used / 1024 / 1024),
				"MB",
			);

			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

			if (await azimuthInput.isVisible({ timeout: 5000 })) {
				// Executar múltiplas rotações
				for (let i = 0; i < 5; i++) {
					for (let angle = 0; angle <= 360; angle += 30) {
						await azimuthInput.fill(angle.toString());
					}
				}

				// Medir uso de memória após operações
				const finalMemory = await page.evaluate(() => {
					return performance.memory
						? {
								used: performance.memory.usedJSHeapSize,
								total: performance.memory.totalJSHeapSize,
								limit: performance.memory.jsHeapSizeLimit,
							}
						: null;
				});

				if (finalMemory) {
					const memoryIncrease = finalMemory.used - initialMemory.used;
					const memoryIncreaseMB = Math.round(memoryIncrease / 1024 / 1024);

					console.log(
						"Memória final:",
						Math.round(finalMemory.used / 1024 / 1024),
						"MB",
					);
					console.log("Aumento de memória:", memoryIncreaseMB, "MB");

					// Verificar que não houve vazamento significativo de memória
					expect(memoryIncreaseMB).toBeLessThan(50); // Menos de 50MB de aumento
				}
			}
		} else {
			console.log("API de performance.memory não disponível");
		}
	});

	test("deve testar performance com diferentes tamanhos de viewport", async ({
		page,
	}) => {
		const viewports = [
			{ width: 1920, height: 1080, name: "Full HD" },
			{ width: 1366, height: 768, name: "HD" },
			{ width: 768, height: 1024, name: "Tablet" },
			{ width: 375, height: 667, name: "Mobile" },
		];

		for (const viewport of viewports) {
			await page.setViewportSize(viewport);

			const startTime = Date.now();

			// Recarregar página com novo viewport
			await page.reload();
			await page.waitForLoadState("networkidle");

			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

			if (await azimuthInput.isVisible({ timeout: 5000 })) {
				// Testar rotação rápida
				for (let angle = 0; angle <= 360; angle += 45) {
					await azimuthInput.fill(angle.toString());
				}
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log(
				`${viewport.name} (${viewport.width}x${viewport.height}): ${duration}ms`,
			);

			// Performance deve ser consistente independente do viewport
			expect(duration).toBeLessThan(5000);
		}
	});

	test("deve medir latência de resposta dos controles", async ({ page }) => {
		const controls = [
			{ selector: 'input[aria-label*="tilt"]', name: "Tilt" },
			{ selector: 'input[aria-label*="azimuth"]', name: "Azimuth" },
			{ selector: 'input[aria-label*="hour"]', name: "Hour" },
		];

		const latencies = [];

		for (const control of controls) {
			const input = page.locator(control.selector).first();

			if (await input.isVisible({ timeout: 3000 })) {
				// Medir latência de resposta
				const startTime = Date.now();

				await input.fill("45");
				await page.waitForTimeout(100); // Aguardar processamento

				const endTime = Date.now();
				const latency = endTime - startTime;

				latencies.push({
					control: control.name,
					latency,
				});

				console.log(`${control.name} latency: ${latency}ms`);
			}
		}

		// Calcular média de latência
		if (latencies.length > 0) {
			const avgLatency =
				latencies.reduce((sum, l) => sum + l.latency, 0) / latencies.length;
			console.log(`Latência média dos controles: ${avgLatency.toFixed(2)}ms`);

			// Verificar latência aceitável
			expect(avgLatency).toBeLessThan(300);
		}
	});
});
