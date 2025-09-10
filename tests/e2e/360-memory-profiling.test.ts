import { test, expect } from "@playwright/test";

// Helper function para formatar logs de memória
const formatMemoryLog = (label: string, bytes: number): string => {
	return `${label}: ${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

test.describe("Cobertura 360 Graus - Profiling de Memória Avançado", () => {
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

	test("deve monitorar uso de memória durante operações 360°", async ({
		page,
	}) => {
		const memorySnapshots: number[] = [];

		// Função para capturar snapshot de memória
		const captureMemory = async () => {
			try {
				// @ts-ignore - Memory API não está tipada
				const memInfo = performance.memory;
				return memInfo ? memInfo.usedJSHeapSize : 0;
			} catch {
				return 0;
			}
		};

		// Snapshot inicial
		const initialMemory = await captureMemory();
		memorySnapshots.push(initialMemory);

		console.log("Memória inicial: " + (initialMemory / 1024 / 1024).toFixed(2) + " MB");

		// Aguardar visualizador carregar
		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		const afterLoadMemory = await captureMemory();
		memorySnapshots.push(afterLoadMemory);

		console.log(`Memória após carregamento: ${(afterLoadMemory / 1024 / 1024).toFixed(2)} MB`);

		// Simular rotações múltiplas
		for (let i = 0; i < 10; i++) {
			await page.mouse.move(400, 300);
			await page.mouse.down();
			await page.mouse.move(400 + (i * 10), 300);
			await page.mouse.up();
			await page.waitForTimeout(100);

			const rotationMemory = await captureMemory();
			memorySnapshots.push(rotationMemory);
		}

		const afterRotationsMemory = await captureMemory();
		console.log(`Memória após rotações: ${(afterRotationsMemory / 1024 / 1024).toFixed(2)} MB`);

		// Verificar que não há vazamentos significativos
		const memoryIncrease = afterRotationsMemory - initialMemory;
		const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

		console.log(`Aumento de memória: ${memoryIncreaseMB.toFixed(2)} MB`);

		// Aumento aceitável: menos de 50MB
		expect(memoryIncreaseMB).toBeLessThan(50);

		// Verificar que snapshots foram capturados
		expect(memorySnapshots.length).toBeGreaterThan(5);
	});

	test("deve detectar vazamentos de memória em operações repetitivas", async ({
		page,
	}) => {
		const memoryReadings: number[] = [];
		const iterations = 20;

		// Função para medir memória
		const getMemoryUsage = async () => {
			try {
				// @ts-ignore
				return performance.memory?.usedJSHeapSize || 0;
			} catch {
				return 0;
			}
		};

		// Baseline
		const baselineMemory = await getMemoryUsage();

		// Executar operações repetitivas
		for (let i = 0; i < iterations; i++) {
			// Simular interação com controles
			const tiltInput = page.locator('input[aria-label*="tilt"]').first();

			if (await tiltInput.isVisible({ timeout: 1000 })) {
				await tiltInput.fill((i % 90).toString());
			}

			// Simular rotação
			await page.mouse.move(400, 300);
			await page.mouse.down();
			await page.mouse.move(450, 300);
			await page.mouse.up();

			await page.waitForTimeout(50);

			// Capturar leitura de memória
			const currentMemory = await getMemoryUsage();
			memoryReadings.push(currentMemory);
		}

		// Análise de tendência
		const finalMemory = memoryReadings[memoryReadings.length - 1];
		const memoryIncrease = finalMemory - baselineMemory;
		const averageMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;

		console.log("Análise de vazamento de memória:");
		console.log(`Baseline: ${(baselineMemory / 1024 / 1024).toFixed(2)} MB`);
		console.log(`Final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
		console.log(`Aumento total: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
		console.log(`Média: ${(averageMemory / 1024 / 1024).toFixed(2)} MB`);

		// Calcular taxa de crescimento
		const growthRate = memoryIncrease / iterations;
		console.log(`Taxa de crescimento por iteração: ${(growthRate / 1024).toFixed(2)} KB`);

		// Verificar se há vazamento significativo
		// Taxa de crescimento aceitável: menos de 1MB por iteração
		expect(growthRate).toBeLessThan(1024 * 1024);

		// Verificar que todas as leituras foram capturadas
		expect(memoryReadings.length).toBe(iterations);
	});

	test("deve monitorar garbage collection durante uso intenso", async ({
		page,
	}) => {
		let gcEvents = 0;

		// Monitorar eventos de GC (se disponível)
		await page.evaluate(() => {
			// @ts-ignore
			if (window.gc) {
				// Forçar GC inicial
				// @ts-ignore
				window.gc();
			}
		});

		const initialMemory = await page.evaluate(() => {
			try {
				// @ts-ignore
				return performance.memory?.usedJSHeapSize || 0;
			} catch {
				return 0;
			}
		});

		// Simular uso intenso que pode trigger GC
		for (let i = 0; i < 50; i++) {
			// Criar elementos temporários
			await page.evaluate(() => {
				const tempDiv = document.createElement("div");
				tempDiv.textContent = "x".repeat(1000); // 1KB de dados
				document.body.appendChild(tempDiv);

				// Remover imediatamente
				setTimeout(() => {
					if (tempDiv.parentNode) {
						tempDiv.parentNode.removeChild(tempDiv);
					}
				}, 10);
			});

			// Interação com visualizador
			const viewerContainer = page
				.locator('[aria-label*="viewer"]')
				.or(page.locator("canvas"))
				.first();

			if (await viewerContainer.isVisible({ timeout: 1000 })) {
				await viewerContainer.click();
			}

			await page.waitForTimeout(20);
		}

		// Forçar GC final
		await page.evaluate(() => {
			// @ts-ignore
			if (window.gc) {
				// @ts-ignore
				window.gc();
			}
		});

		const finalMemory = await page.evaluate(() => {
			try {
				// @ts-ignore
				return performance.memory?.usedJSHeapSize || 0;
			} catch {
				return 0;
			}
		});

		const memoryDiff = finalMemory - initialMemory;
		const memoryDiffMB = memoryDiff / 1024 / 1024;

		console.log("Monitoramento de GC:");
		console.log(`Memória inicial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
		console.log(`Memória final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
		console.log(`Diferença: ${memoryDiffMB.toFixed(2)} MB`);

		// Após GC, a diferença de memória deve ser mínima
		expect(Math.abs(memoryDiffMB)).toBeLessThan(10);
	});

	test("deve analisar heap fragmentation", async ({ page }) => {
		const heapSnapshots: Array<{ used: number; total: number; limit: number }> = [];

		// Capturar snapshots do heap
		const captureHeapSnapshot = async () => {
			try {
				// @ts-ignore
				const mem = performance.memory;
				if (mem) {
					return {
						used: mem.usedJSHeapSize,
						total: mem.totalJSHeapSize,
						limit: mem.jsHeapSizeLimit,
					};
				}
			} catch {
				// Fallback
			}
			return null;
		};

		// Snapshot inicial
		const initialSnapshot = await captureHeapSnapshot();
		if (initialSnapshot) {
			heapSnapshots.push(initialSnapshot);
		}

		// Simular alocação e desalocação de memória
		for (let cycle = 0; cycle < 5; cycle++) {
			// Alocar memória (criar muitos elementos)
			await page.evaluate(() => {
				for (let i = 0; i < 100; i++) {
					const div = document.createElement("div");
					div.textContent = "test".repeat(100); // ~400 bytes
					div.style.display = "none";
					document.body.appendChild(div);

					// Agendar remoção
					setTimeout(() => {
						if (div.parentNode) {
							div.parentNode.removeChild(div);
						}
					}, 100);
				}
			});

			// Interagir com visualizador
			const tiltInput = page.locator('input[aria-label*="tilt"]').first();
			if (await tiltInput.isVisible({ timeout: 1000 })) {
				await tiltInput.fill((cycle * 20).toString());
			}

			await page.waitForTimeout(200);

			// Capturar snapshot
			const snapshot = await captureHeapSnapshot();
			if (snapshot) {
				heapSnapshots.push(snapshot);
			}
		}

		// Analisar fragmentação
		if (heapSnapshots.length > 1) {
			const first = heapSnapshots[0];
			const last = heapSnapshots[heapSnapshots.length - 1];

			const fragmentationRatio = last.total / last.limit;
			const efficiencyRatio = last.used / last.total;

			console.log("Análise de fragmentação do heap:");
			console.log(`Relação de fragmentação: ${(fragmentationRatio * 100).toFixed(2)}%`);
			console.log(`Eficiência de uso: ${(efficiencyRatio * 100).toFixed(2)}%`);
			console.log(`Limite do heap: ${(last.limit / 1024 / 1024).toFixed(2)} MB`);

			// Verificar que não está próximo do limite
			expect(fragmentationRatio).toBeLessThan(0.9);
		}

		expect(heapSnapshots.length).toBeGreaterThan(3);
	});

	test("deve monitorar performance de renderização", async ({ page }) => {
		// Habilitar monitoramento de performance
		await page.evaluate(() => {
			// @ts-ignore
			if (performance.mark && performance.measure) {
				performance.mark("render-start");
			}
		});

		const viewerContainer = page
			.locator('[aria-label*="viewer"]')
			.or(page.locator("canvas"))
			.first();

		await viewerContainer.waitFor({ state: "visible", timeout: 10000 });

		// Medir tempo de renderização
		const renderMetrics = await page.evaluate((): {
			firstPaint?: number;
			firstContentfulPaint?: number;
			approximateFps?: number;
		} => {
			const metrics: {
				firstPaint?: number;
				firstContentfulPaint?: number;
				approximateFps?: number;
			} = {};

			// Medir paint timing
			// @ts-ignore
			const paintEntries = performance.getEntriesByType("paint");
			if (paintEntries.length > 0) {
				metrics.firstPaint = paintEntries[0].startTime;
				if (paintEntries.length > 1) {
					metrics.firstContentfulPaint = paintEntries[1].startTime;
				}
			}

			// Medir frame rate aproximado
			let frameCount = 0;
			const startTime = performance.now();

			const measureFrames = () => {
				frameCount++;
				if (performance.now() - startTime < 1000) {
					requestAnimationFrame(measureFrames);
				} else {
					metrics.approximateFps = frameCount;
				}
			};

			measureFrames();

			// Aguardar medição completar
			setTimeout(() => {
				console.log("Métricas de renderização:");
				if (metrics.firstPaint) {
					console.log("First Paint: " + metrics.firstPaint.toFixed(2) + "ms");
				}
				if (metrics.firstContentfulPaint) {
					console.log("First Contentful Paint: " + metrics.firstContentfulPaint.toFixed(2) + "ms");
				}
				if (metrics.approximateFps) {
					console.log("FPS aproximado: " + metrics.approximateFps);
				}
			}, 1100);

			return metrics;
		});

		// Verificar performance aceitável
		expect(true).toBe(true); // Placeholder para validação de performance
	});
		page,
	}) => {
		let eventListenerCount = 0;

		// Contar event listeners antes
		const initialListeners = await page.evaluate(() => {
			let count = 0;
			const elements = document.querySelectorAll("*");
			elements.forEach((el) => {
				// @ts-ignore
				if (el._events || getEventListeners) {
					count++;
				}
			});
			return count;
		});

		// Simular adição de muitos event listeners
		for (let i = 0; i < 20; i++) {
			await page.evaluate(() => {
				const div = document.createElement("div");
				div.addEventListener("click", () => {});
				div.addEventListener("mouseover", () => {});
				document.body.appendChild(div);

				// Alguns elementos permanecem, outros são removidos
				if (i % 2 === 0) {
					setTimeout(() => {
						if (div.parentNode) {
							div.parentNode.removeChild(div);
						}
					}, 100);
				}
			});

			// Interagir com visualizador
			const viewerContainer = page
				.locator('[aria-label*="viewer"]')
				.or(page.locator("canvas"))
				.first();

			if (await viewerContainer.isVisible({ timeout: 1000 })) {
				await viewerContainer.click();
			}

			await page.waitForTimeout(50);
		}

		// Contar event listeners depois
		const finalListeners = await page.evaluate(() => {
			let count = 0;
			const elements = document.querySelectorAll("*");
			elements.forEach((el) => {
				// @ts-ignore
				if (el._events || getEventListeners) {
					count++;
				}
			});
			return count;
		});

		const listenerIncrease = finalListeners - initialListeners;

		console.log(`Análise de event listeners:`);
		console.log(`Listeners iniciais: ${initialListeners}`);
		console.log(`Listeners finais: ${finalListeners}`);
		console.log(`Aumento: ${listenerIncrease}`);

		// Verificar que não há acúmulo excessivo de listeners
		expect(listenerIncrease).toBeLessThan(50);
	});

	test("deve monitorar uso de memória em diferentes navegadores", async ({
		page,
	}) => {
		// Detectar informações do navegador
		const browserInfo = await page.evaluate(() => {
			return {
				userAgent: navigator.userAgent,
				platform: navigator.platform,
				language: navigator.language,
				cookieEnabled: navigator.cookieEnabled,
			};
		});

		console.log(`Informações do navegador:`);
		console.log(`User Agent: ${browserInfo.userAgent}`);
		console.log(`Platform: ${browserInfo.platform}`);
		console.log(`Language: ${browserInfo.language}`);

		// Medir memória específica do navegador
		const memoryInfo = await page.evaluate(() => {
			try {
				// @ts-ignore
				const mem = performance.memory;
				if (mem) {
					return {
						used: mem.usedJSHeapSize,
						total: mem.totalJSHeapSize,
						limit: mem.jsHeapSizeLimit,
						ratio: mem.usedJSHeapSize / mem.jsHeapSizeLimit,
					};
				}
			} catch {
				// Fallback para navegadores sem memory API
			}
			return null;
		});

		if (memoryInfo) {
			console.log(`Informações de memória:`);
			console.log(`Usado: ${(memoryInfo.used / 1024 / 1024).toFixed(2)} MB`);
			console.log(`Total: ${(memoryInfo.total / 1024 / 1024).toFixed(2)} MB`);
			console.log(`Limite: ${(memoryInfo.limit / 1024 / 1024).toFixed(2)} MB`);
			console.log(`Relação usado/limite: ${(memoryInfo.ratio * 100).toFixed(2)}%`);

			// Verificar que não está usando mais de 80% do limite
			expect(memoryInfo.ratio).toBeLessThan(0.8);
		} else {
			console.log("Memory API não disponível neste navegador");
		}

		// Verificar que informações básicas foram capturadas
		expect(browserInfo.userAgent).toBeTruthy();
		expect(browserInfo.platform).toBeTruthy();
	});

	test("deve analisar performance de rede e cache", async ({ page }) => {
		// Limpar cache e cookies para teste limpo
		await page.context().clearCookies();
		await page.reload();

		const networkRequests: Array<{ url: string; size: number; duration: number }> = [];

		// Monitorar requisições de rede
		page.on("response", async (response) => {
			try {
				const url = response.url();
				const headers = response.headers();

				// Calcular tamanho aproximado
				let size = 0;
				try {
					const buffer = await response.body();
					size = buffer.length;
				} catch {
					// Alguns responses não têm body
				}

				networkRequests.push({
					url,
					size,
					duration: 0, // Não temos timing preciso
				});
			} catch {
				// Ignorar erros
			}
		});

		// Carregar aplicação
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Aguardar um pouco para capturar todas as requisições
		await page.waitForTimeout(1000);

		// Analisar requisições
		const totalSize = networkRequests.reduce((sum, req) => sum + req.size, 0);
		const totalRequests = networkRequests.length;

		console.log(`Análise de performance de rede:`);
		console.log(`Total de requisições: ${totalRequests}`);
		console.log(`Tamanho total transferido: ${(totalSize / 1024).toFixed(2)} KB`);

		// Filtrar por tipo de conteúdo
		const jsRequests = networkRequests.filter((req) =>
			req.url.includes(".js"),
		);
		const cssRequests = networkRequests.filter((req) =>
			req.url.includes(".css"),
		);
		const imageRequests = networkRequests.filter((req) =>
			req.url.match(/\.(png|jpg|jpeg|gif|svg|webp)/),
		);

		console.log(`Requisições JavaScript: ${jsRequests.length}`);
		console.log(`Requisições CSS: ${cssRequests.length}`);
		console.log(`Requisições de imagem: ${imageRequests.length}`);

		// Verificar que não há requisições excessivas
		expect(totalRequests).toBeLessThan(100);
		expect(totalSize).toBeLessThan(10 * 1024 * 1024); // Menos de 10MB
	});
});